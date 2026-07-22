const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => { 
    try {
        //gets incoming data
        const { firstName, lastName, login, password} = req.body;
        //checks if user exists
        const existingUser = await User.findOne({ login: login});

        if(existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }
        //password hashes
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const verificationToken = crypto.randomBytes(20).toString('hex');

        const newUser = new User({
            firstName: firstName,
            lastName: lastName,
            login: login,
            password: hashedPassword,
            verificationToken: verificationToken,
            isVerified: false
        });

        await newUser.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD
            }
        });

        const verificationLink = `http://Oozedues.xyz/verify/${verificationToken}`;

        await transporter.sendMail({
            from: 'Oozedues@gmail.com',
            to: login,
            subject: 'Verify your OozeDues Account',
            html: `<p>Click <a href="${verificationLink}"> here</a> to verify your account.</p>`
        });

        res.status(201).json({ error: "" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const {login, password } = req.body;

        const user = await User.findOne({ login: login });
        if (!user) {
            return res.status(400).json({ error: "Username / password combination incorrect." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Username / password combination incorrect." });
        }

        if (!user.isVerified) {
            return res.status(401).json({ error: "Please check your email and verify your account before logging in." });   
        }

        const payload = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;

                res.status(200).json({
                    token: token,
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    error: ""
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/verify/:token', async(req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token });

        if (!user) return res.status(400).json({ error: "Invalid or expired token" });

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ message: "Account successfull verified!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
}));

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('http://Oozedues.xyz');
    }
);

module.exports = router;