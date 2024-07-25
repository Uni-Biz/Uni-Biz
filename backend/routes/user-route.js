require('dotenv').config();
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { sendNotification } = require('../websocketServer');
const { calculateRecommendedServices } = require('./recommendationHelpers');
const {applyTimeDecay} = require('./recommendationHelpers')
const {getMatrix} = require('./recommendationHelpers')
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const querystring = require('querystring');
const authenticateJWT  = require("../middlewares/authenticateJWT");
const multer = require('multer');
const { get } = require('https');

const { oauth2Client, SCOPES } = require('../middlewares/GoogleOAuthConfig');
const {google} = require('googleapis');

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
            where: { id: req.user.id },
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
        const { serviceType, serviceName, description, price, availableTimes } = req.body;
        const image = req.file ? req.file.buffer : null;

        const newService = await prisma.service.create({
            data: {
                serviceType,
                serviceName,
                description,
                price: parseFloat(price),
                image,
                userId: req.user.id
            }
        });

        if (availableTimes) {
            const times = JSON.parse(availableTimes);
            for (const time of times) {
                await prisma.availableTime.create({
                    data: {
                        serviceId: newService.id,
                        startTime: new Date(time.startTime),
                        endTime: new Date(time.endTime)
                    }
                });
            }
        }

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

router.get('/services/:id/available-times', authenticateJWT, async (req, res) => {
    const { id } = req.params;
    try {
        const availableTimes = await prisma.availableTime.findMany({
            where: { serviceId: parseInt(id) }
        });
        res.status(200).json(availableTimes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching available times' });
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

router.delete('/services/:serviceId/comments/:commentId', authenticateJWT, async (req, res) => {
    const { serviceId, commentId } = req.params;
    const userId = req.user.id;

    try {
        // Check if the review belongs to the current user
        const review = await prisma.reviewAndRating.findUnique({
            where: { id: parseInt(commentId) },
            include: { user: true }
        });

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        if (review.userId !== userId) {
            return res.status(403).json({ error: 'You can only delete your own comments' });
        }

        // Delete the review
        await prisma.reviewAndRating.delete({
            where: { id: parseInt(commentId) }
        });

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting review' });
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
                favoritedBy: true,
                availableTimes: true // Include available times
            }
        });

        // Fetch all reviews
        const allReviews = await prisma.reviewAndRating.findMany({
            where: {
                serviceId: {
                    in: allServices.map(service => service.id)
                }
            },
            select: {
                rating: true,
                createdAt: true,
                serviceId: true, // Include serviceId to filter reviews by service
                userId: true,
            },
        });

        // Fetch Favorites
        const allFavorites = await prisma.favorite.findMany({
            select: {
                user: {
                    select: {
                        username: true
                    }
                },
                service: {
                    select: {
                        serviceName: true
                    }
                }
            }
        });

        const { matrix, cosineSimMatrix, users, services } = getMatrix(allFavorites);

        // Apply time decay to the reviews
        const rateTime = applyTimeDecay(allReviews);

        // Calculate recommended services
        const recommendedServices = calculateRecommendedServices(allServices, userId, rateTime, cosineSimMatrix, services, allFavorites);

        res.status(200).json(recommendedServices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching recommended services' });
    }
});

router.post('/book-service', authenticateJWT, async (req, res) => {
    try {
        const { serviceId, timeId } = req.body;

        const service = await prisma.service.findUnique({
            where: { id: parseInt(serviceId) },
            include: { user: true } // Include the user who offers the service
        });

        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        const availableTime = await prisma.availableTime.findUnique({
            where: { id: parseInt(timeId) }
        });

        if (!availableTime) {
            return res.status(404).json({ error: 'Time slot not found' });
        }

        if (availableTime.isBooked) {
            return res.status(400).json({ error: 'Time slot is already booked' });
        }

        const booking = await prisma.booking.create({
            data: {
                userId: req.user.id,
                serviceId: parseInt(serviceId),
                timeId: parseInt(timeId)
            }
        });

        await prisma.availableTime.update({
            where: { id: parseInt(timeId) },
            data: { isBooked: true }
        });

        const notificationContentForUser = `You booked ${service.serviceName} with ${service.user.username} for ${new Date(availableTime.startTime).toLocaleString()}`;
        const notificationContentForServiceProvider = `${req.user.username} booked ${service.serviceName} with you for ${new Date(availableTime.startTime).toLocaleString()}`;

        // Create notification for the user who booked the service
        await prisma.notification.create({
            data: {
                content: notificationContentForUser,
                userId: req.user.id,
                serviceId: service.id
            }
        });

        // Increment unread count for the user who booked the service
        await prisma.user.update({
            where: { id: req.user.id },
            data: {
                unreadCount: {
                    increment: 1
                }
            }
        });

        // Create notification for the user who offers the service
        await prisma.notification.create({
            data: {
                content: notificationContentForServiceProvider,
                userId: service.user.id,
                serviceId: service.id
            }
        });

        // Increment unread count for the user who offers the service
        await prisma.user.update({
            where: { id: service.user.id },
            data: {
                unreadCount: {
                    increment: 1
                }
            }
        });

        const bookingDetails = {
            userId: req.user.id,
            serviceId: service.id,
            timeId: availableTime.id,
            userName: req.user.username,
            serviceName: service.serviceName,
            businessName: service.user.username,
            bookingTime: new Date().toISOString(),
            serviceCreatorId: service.userId
        };

        sendNotification(bookingDetails);

        res.status(201).json({
            message: 'Booking created successfully',
            booking: booking
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating booking' });
    }
});


router.get('/bookings', authenticateJWT, async (req, res) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { userId: req.user.id },
            include: {
                service: true,
                time: true,
            },
        });



        res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching bookings' });
    }
});

router.get('/offered-bookings', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch bookings where the services are offered by the logged-in user
        const offeredBookings = await prisma.booking.findMany({
            where: {
                service: {
                    userId: userId
                }
            },
            include: {
                service: true,
                time: true,
                user: true // Assuming you want details of the user who booked the service
            }
        });

        res.status(200).json(offeredBookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching offered bookings' });
    }
});

router.delete('/offered-bookings/:id', authenticateJWT, async (req, res) => {
    const bookingId = parseInt(req.params.id);

    try {
        // Find the booking
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                time: true,
                service: {
                    include: {
                        user: true // Include the user who offers the service
                    }
                },
                user: true // Include the user who made the booking
            }
        });

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Ensure the authenticated user is the service provider
        if (booking.service.userId !== req.user.id) {
            return res.status(403).json({ error: 'You are not authorized to cancel this booking' });
        }

        // Delete the booking
        await prisma.booking.delete({
            where: { id: bookingId }
        });

        // Update the time slot to mark it as not booked
        await prisma.availableTime.update({
            where: { id: booking.timeId },
            data: { isBooked: false }
        });

        const notificationContentForUser = `Your booking of ${booking.service.serviceName} with ${booking.service.user.username} has been canceled for ${new Date(booking.time.startTime).toLocaleString()}`;
        const notificationContentForServiceProvider = `You canceled ${booking.user.username}'s booking of ${booking.service.serviceName} for ${new Date(booking.time.startTime).toLocaleString()}`;

        // Create notification for the user who made the booking
        await prisma.notification.create({
            data: {
                content: notificationContentForUser,
                userId: booking.user.id,
                serviceId: booking.service.id
            }
        });

        // Increment unread count for the user who made the booking
        await prisma.user.update({
            where: { id: booking.user.id },
            data: {
                unreadCount: {
                    increment: 1
                }
            }
        });

        // Create notification for the service provider
        await prisma.notification.create({
            data: {
                content: notificationContentForServiceProvider,
                userId: booking.service.user.id,
                serviceId: booking.service.id
            }
        });

        // Increment unread count for the service provider
        await prisma.user.update({
            where: { id: booking.service.user.id },
            data: {
                unreadCount: {
                    increment: 1
                }
            }
        });

        const cancellationDetails = {
            userId: booking.user.id,
            serviceId: booking.service.id,
            timeId: booking.time.id,
            userName: booking.user.username,
            serviceName: booking.service.serviceName,
            businessName: booking.service.user.username,
            cancellationTime: new Date().toISOString(),
            serviceCreatorId: booking.service.userId
        };

        sendNotification(cancellationDetails);

        res.status(200).json({ message: 'Booking canceled successfully' });
    } catch (error) {
        console.error('Error canceling booking:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});

router.delete('/bookings/:id', authenticateJWT, async (req, res) => {
    const bookingId = parseInt(req.params.id);

    try {
        // Find the booking
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                time: true,
                service: {
                    include: {
                        user: true // Include the user who offers the service
                    }
                },
                user: true // Include the user who made the booking
            }
        });

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Ensure the booking belongs to the authenticated user or the service provider is the authenticated user
        if (booking.userId !== req.user.id && booking.service.userId !== req.user.id) {
            return res.status(403).json({ error: 'You are not authorized to cancel this booking' });
        }

        // Delete the booking
        await prisma.booking.delete({
            where: { id: bookingId }
        });

        // Update the time slot to mark it as not booked
        await prisma.availableTime.update({
            where: { id: booking.timeId },
            data: { isBooked: false }
        });

        const notificationContentForUser = `You canceled your booking of ${booking.service.serviceName} with ${booking.service.user.username} for ${new Date(booking.time.startTime).toLocaleString()}`;
        const notificationContentForServiceProvider = `${req.user.username} canceled their booking of ${booking.service.serviceName} with you for ${new Date(booking.time.startTime).toLocaleString()}`;

        // Create notification for the user who canceled the booking
        await prisma.notification.create({
            data: {
                content: notificationContentForUser,
                userId: booking.user.id,
                serviceId: booking.service.id
            }
        });

        // Increment unread count for the user who canceled the booking
        await prisma.user.update({
            where: { id: booking.user.id },
            data: {
                unreadCount: {
                    increment: 1
                }
            }
        });

        // Create notification for the service provider
        await prisma.notification.create({
            data: {
                content: notificationContentForServiceProvider,
                userId: booking.service.user.id,
                serviceId: booking.service.id
            }
        });

        // Increment unread count for the service provider
        await prisma.user.update({
            where: { id: booking.service.user.id },
            data: {
                unreadCount: {
                    increment: 1
                }
            }
        });

        const cancellationDetails = {
            userId: req.user.id,
            serviceId: booking.service.id,
            timeId: booking.time.id,
            userName: req.user.username,
            serviceName: booking.service.serviceName,
            businessName: booking.service.user.username,
            cancellationTime: new Date().toISOString(),
            serviceCreatorId: booking.service.userId
        };

        sendNotification(cancellationDetails);

        res.status(200).json({ message: 'Booking canceled successfully' });
    } catch (error) {
        console.error('Error canceling booking:', error);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});


router.post('/create-notification', authenticateJWT, async (req, res) => {
    const { content, userId } = req.body;

    try {
        await prisma.notification.create({
            data: {
                content,
                userId,
            }
        });

        await prisma.user.update({
            where: { id: userId },
            data: { unreadCount: { increment: 1 } }
        });

        res.status(201).json({ message: 'Notification created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating notification' });
    }
});

router.delete('/notifications/:id', authenticateJWT, async (req, res) => {
    const notificationId = parseInt(req.params.id);

    try {
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.userId !== req.user.id) {
            return res.status(403).json({ error: 'You are not authorized to delete this notification' });
        }

        await prisma.notification.delete({
            where: { id: notificationId }
        });

        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

router.get('/notifications', authenticateJWT, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { timestamp: 'desc' }
        });
        res.status(200).json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching notifications' });
    }
});

router.get('/notifications/unread-count', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { unreadCount: true }
        });
        res.status(200).json({ unreadCount: user.unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching unread count' });
    }
});


router.post('/notifications/reset-unread-count', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        await prisma.user.update({
            where: { id: userId },
            data: { unreadCount: 0 }
        });
        res.status(200).json({ message: 'Unread count reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error resetting unread count' });
    }
});


router.post('/notifications/update-unread-count', authenticateJWT, async (req, res) => {
    try {
        const { unreadCount } = req.body;
        const userId = req.user.id;
        await prisma.user.update({
            where: { id: userId },
            data: { unreadCount }
        });
        res.status(200).json({ message: 'Unread count updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating unread count' });
    }
});

router.get('/auth-url', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    res.json({ url }); // Send URL back to client
});

// API Endpoint to Start the OAuth flow
router.get('/google-calendar', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    res.redirect(url);
});

router.get('/google-calendar/events', authenticateJWT, async (req, res) => {
    try {
        const events = await prisma.googleCalendar.findMany({
            where: { userId: req.user.id },
            orderBy: { startAt: 'asc' }, // Optional: Order events by start time
        });
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching Google Calendar events:', error);
        res.status(500).json({ error: 'Failed to fetch Google Calendar events' });
    }
});

// API Endpoint for Callback to Exchange Authorization code for Access Token
router.post('/google-calendar/callback', authenticateJWT, async (req, res) => {
    const { code } = req.body; // Get code from the body instead of query
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        await prisma.user.update({
            where: { id: req.user.id},
            data: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenExpiry: new Date(tokens.expiry_date),
            },
        });
        res.json({ message: 'Authentication successful', tokens });
    } catch (error) {
        console.error('Error retrieving access token', error);
        res.status(500).send('Error retrieving access token');
    }
});

// API Endpoint for Fetching & Syncing Google Calendar Events
router.get('/google-calendar/sync', authenticateJWT, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
    });

    if (!user || !user.accessToken || !user.refreshToken) {
        return res.status(401).send('Not authenticated with Google');
    }

    oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
        expiry_date: user.tokenExpiry.getTime(),
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    try {
        // Fetches list of Calendar Events from Google Calendar API
        const events = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            maxResults: 2500,
            singleEvents: true,
            orderBy: 'startTime',
        });

        // Stores fetched Google Calendar Events into Database
        const parsedEvents = events.data.items.map(event => ({
            title: event.summary || 'Untitled Event',
            startAt: new Date(event.start.dateTime || event.start.date),
            endAt: new Date(event.end.dateTime || event.end.date),
            allDay: Boolean(!event.start.dateTime && !event.end.dateTime && event.start.date && event.end.date),
            userId: 1,
            googleId: event.id
        }));

        // Creates/Updates the Google Calendar Events into Database via Prisma
        for (const event of parsedEvents) {
            try {
                await prisma.googleCalendar.upsert({
                    where: { googleId: event.googleId },
                    update: {
                        title: event.title,
                        startAt: event.startAt,
                        endAt: event.endAt,
                        allDay: event.allDay,
                    },
                    create: {
                        googleId: event.googleId,
                        title: event.title,
                        startAt: event.startAt,
                        endAt: event.endAt,
                        allDay: event.allDay,
                        user: {
                            connect: {
                                id: 1
                            }
                        },
                    }
                });
            } catch (error) {
                console.error(`Error processing event ${event.googleId}:`, error);
            }
        }

        res.json({ message: 'Done Syncing Calendar Events'});

    } catch (error) {
        console.error('Error syncing Google Calendar events', error);
        res.status(500).json({ error: 'Failed to sync Google Calendar events' });
    }
})

module.exports = router;
