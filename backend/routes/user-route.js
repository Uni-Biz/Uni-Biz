require('dotenv').config();
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
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
    const userInfo = await prisma.user.findUnique({
        where: { username: req.user.username },
    });

    if (userInfo === null) {
        return res.status(404).json({ error: "User not found" });
    }

    return res.json(userInfo);
});

router.post('/create-profile', authenticateJWT, async (req, res) => {
    const { businessName, logo, bio } = req.body;

    try {
        const existingProfile = await prisma.businessProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (existingProfile) {
            return res.status(400).json({ error: 'Profile already exists for this user' });
        }

        const businessProfile = await prisma.businessProfile.create({
            data: {
                businessName,
                logo,
                bio,
                userId: req.user.id
            },
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

module.exports = router;
