import { Router } from 'express';
import passport from 'passport';
import { sendOTP, verifyOTP } from '../services/otp.service';

const router = Router();

router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/spreadsheets.readonly'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect to client.
        res.redirect(`${process.env.FRONTEND_URL}/dashboard/1`);
    });

router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect(`${process.env.FRONTEND_URL}/dashboard/1`);
    });
});

// Mobile OTP Routes

router.post('/otp/send', (req, res) => {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ message: "Mobile number required" });

    sendOTP(mobile);
    // Always return success to prevent user mining (though console logs reveal it in dev)
    res.json({ message: "OTP sent successfully" });
});

router.post('/otp/verify', (req, res, next) => {
    const { mobile, code } = req.body;

    if (verifyOTP(mobile, code)) {
        // Create a mock user object for the session
        const mobileUser = {
            id: `mobile_${mobile}`,
            displayName: `Mobile User (${mobile})`,
            provider: 'mobile',
            email: `${mobile}@mobile.eventrix.app` // Fake email for consistency
        };

        // Manually log the user in using Passport's req.login
        req.login(mobileUser, (err) => {
            if (err) return next(err);
            return res.json({ message: "Login successful", user: mobileUser });
        });
    } else {
        res.status(401).json({ message: "Invalid or expired OTP" });
    }
});

router.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: "Not authenticated" });
    }
});

export default router;
