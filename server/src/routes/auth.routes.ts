import { Router } from 'express';
import passport from 'passport';
// OTP service removed


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

// Mobile OTP Routes removed


router.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: "Not authenticated" });
    }
});

export default router;
