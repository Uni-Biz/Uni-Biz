require('dotenv').config();
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { calculateRecommendedServices } = require('./recommendationHelpers');
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const querystring = require('querystring');
const authenticateJWT  = require("../middlewares/authenticateJWT");
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/signup", async (req, res) => {
    const { first_name, last_name, email, username, password } = req.body;

    try {
        // Check if username already exists
        const existingUser = await prisma.user.findFirst({ where: { username } });

        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // If username doesn't exist, proceed with user creation
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                first_name,
                last_name,
                username,
                email,
                password: hashedPassword,
            },
        });

        res.status(201).json({ message: "User Signed Up", user: newUser });

    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: 'User could not be created.' });
    }
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (user === null) {
            return res.status(401).json({ "status": "Invalid credentials" });
        }
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
            const isProfileComplete = user.profileComplete;
            const redirect = '/dashboard'
            res.json({
                token: token,
                redirect: isProfileComplete ? '/dashboard' : '/create-profile'
            });
        } else {
            return res.status(401).json({ "status": "Invalid credentials" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.post('/verify-email', async (req, res) => {
    const { token } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.update({
            where: { id: decoded.id },
            data: { isVerified: true },
        });

        res.status(200).json({ message: 'Email verified successfully.' });
    } catch (error) {
        res.status(400).json({ error: 'Invalid or expired token.' });
    }
});

router.get("/info", authenticateJWT, async (req, res) => {
    try {
        const userInfo = await prisma.user.findUnique({
            where: { username: req.user.username },
            include: { profile: true },
        });

        if (!userInfo) {
            return res.status(404).json({ error: "User not found" });
        }

        // Convert logo to base64 string
        if (userInfo.profile && userInfo.profile.logo) {
            userInfo.profile.logo = userInfo.profile.logo.toString('base64');
        }

        return res.json(userInfo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});


router.post('/create-profile', authenticateJWT, upload.single('logo'), async (req, res) => {
    const { businessName, bio } = req.body;
    const logo = req.file;

    try {
        // Check if a BusinessProfile already exists for the user
        const existingProfile = await prisma.businessProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (existingProfile) {
            return res.status(400).json({ error: 'Profile already exists for this user' });
        }

        const businessProfile = await prisma.businessProfile.create({
            data: {
                businessName,
                bio,
                logo: logo.buffer, // Store the file buffer (blob) in the database
                userId: req.user.id
            }
        });

        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                profileComplete: true
            }
        });

        const accessToken = jwt.sign({ id: req.user.id, username: req.user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });


        res.json({
            message: 'Profile created successfully',
            token: accessToken,
            redirect: '/dashboard'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating profile' });
    }
});

router.delete('/delete-profile', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.id;

        // Delete the profile associated with the user
        await prisma.businessProfile.delete({
            where: { userId: userId }
        });

        // Update the user to mark profile as incomplete
        await prisma.user.update({
            where: { id: userId },
            data: {
                profileComplete: false
            }
        });

        res.json({ message: 'Profile deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting profile' });
    }
});



// Endpoint to update user profile
router.put('/update-profile', authenticateJWT, upload.single('logo'), async (req, res) => {
    const { businessName, bio } = req.body;
    const logo = req.file;

    try {
        const userId = req.user.id;

        // Update the profile associated with the user
        const updatedProfile = await prisma.businessProfile.update({
            where: { userId: userId },
            data: {
                businessName,
                bio,
                logo: logo ? logo.buffer : undefined  // Only update logo if a new file is uploaded
            }
        });

        res.json({ message: 'Profile updated successfully', profile: updatedProfile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating profile' });
    }
});

router.post('/create-service', authenticateJWT, upload.single('image'), async (req, res) => {
    try {
        const { serviceType, serviceName, businessName, description, price } = req.body;
        const image = req.file ? req.file.buffer : null;

        const newService = await prisma.service.create({
            data: {
                serviceType,
                serviceName,
                businessName,
                description,
                price: parseFloat(price),
                image,
                userId: req.user.id
            }
        });

        res.status(201).json({
            message: 'Service created successfully',
            service: newService
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating service' });
    }
});



router.get('/services', authenticateJWT, async (req, res) => {
    try {
        const services = await prisma.service.findMany({
            where: { userId: req.user.id },
            include: { reviewsAndRatings: true }
        });

        const servicesWithRatings = services.map(service => {
            const totalRatings = service.reviewsAndRatings.length;
            const averageRating = totalRatings > 0
                ? service.reviewsAndRatings.reduce((sum, review) => sum + review.rating, 0) / totalRatings
                : 0;

            return {
                ...service,
                averageRating: averageRating.toFixed(2),
                image: service.image ? Buffer.from(service.image).toString('base64') : null  // Handle missing image
            };
        });

        res.status(200).json(servicesWithRatings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching services' });
    }
});


router.delete('/services/:id', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const service = await prisma.service.findUnique({
            where: { id: parseInt(id) }
        });

        if (!service || service.userId !== req.user.id) {
            return res.status(404).json({ error: 'Service not found or not authorized' });
        }

        await prisma.service.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting service' });
    }
});

router.post('/services/:id/comments', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { reviewText, rating } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        const review = await prisma.reviewAndRating.create({
            data: {
                reviewText,
                rating: parseInt(rating),
                user: { connect: { id: user.id } },
                service: { connect: { id: parseInt(id) } }
            }
        });
        res.status(201).json(review);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding comment' });
    }
});

router.get('/services/:id/comments', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const reviews = await prisma.reviewAndRating.findMany({
            where: { serviceId: parseInt(id) },
            include: { user: true }
        });
        res.status(200).json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching comments' });
    }
});

// Add Favorite Service
router.post('/services/:id/favorite', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const service = await prisma.service.findUnique({
            where: { id: parseInt(id) }
        });

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        await prisma.favorite.create({
            data: {
                userId: req.user.id,
                serviceId: parseInt(id)
            }
        });

        res.status(200).json({ message: 'Service added to favorites' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding service to favorites' });
    }
});


router.get('/favorites', authenticateJWT, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                favorites: {
                    include: {
                        service: {
                            include: {
                                reviewsAndRatings: true,
                                user: true
                            }
                        }
                    }
                }
            }
        });

        const favoriteServices = user.favorites.map(favorite => {
            const service = favorite.service;
            return {
                ...service,
                averageRating: service.reviewsAndRatings.length > 0
                    ? service.reviewsAndRatings.reduce((sum, review) => sum + review.rating, 0) / service.reviewsAndRatings.length
                    : 0,
                    image: Buffer.from(service.image).toString('base64')
            };
        });

        res.status(200).json(favoriteServices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching favorite services' });
    }
});

router.delete('/services/:id/favorite', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const service = await prisma.service.findUnique({
            where: { id: parseInt(id) }
        });

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        await prisma.favorite.delete({
            where: {
                userId_serviceId: {
                    userId: req.user.id,
                    serviceId: parseInt(id)
                }
            }
        });

        res.status(200).json({ message: 'Service removed from favorites' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error removing service from favorites' });
    }
});


router.get('/services/recommended', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch all services
        const allServices = await prisma.service.findMany({
            include: {
                user: {
                    include: {
                        profile: true
                    }
                },
                reviewsAndRatings: true,
                favoritedBy: true
            }
        });

        // Calculate recommended services
        const recommendedServices = calculateRecommendedServices(allServices, userId);

        res.status(200).json(recommendedServices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching recommended services' });
    }
});

module.exports = router;
