require('dotenv').config();
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const querystring = require('querystring');
const authenticateJWT  = require("../middlewares/authenticateJWT");

router.post("/signup", async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });

        res.status(201).json({ user });
    } catch (error) {
        res.status(500).json({ error: 'User could not be created.' });
    }
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (user === null) {
            return res.status(403).json({ "status": "bad username/password" });
        }
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.status(201).json({ "status": "logged in", "token": token });
        } else {
            return res.status(403).json({ "status": "bad username/password" });
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


module.exports = router;
