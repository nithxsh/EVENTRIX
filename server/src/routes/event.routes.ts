import { Router } from 'express';
import { getEvent, updateEvent, getEventRegistrations, sendEventEmails, verifyCertificate, getLivePulse } from '../controllers/event.controller';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
        return next();
    }
    // next(); // UNCOMMENT FOR DEV IF AUTH FAILS
    res.status(401).json({ message: 'Not authenticated' });
};

router.get('/:id', getEvent);
router.put('/:id', isAuthenticated, updateEvent);
router.get('/:id/registrations', isAuthenticated, getEventRegistrations);

router.get('/verify/:hash', verifyCertificate);
router.get('/:id/pulse', getLivePulse);

router.post('/:id/email', isAuthenticated, upload.fields([
    { name: 'certTemplate', maxCount: 1 },
    { name: 'recipientFile', maxCount: 1 }
]), sendEventEmails);

export default router;
