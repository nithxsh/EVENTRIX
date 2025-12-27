import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import session from 'express-session';

import './config/passport';
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/api/events', eventRoutes);


app.get('/', (req, res) => {
    res.send('Eventrix API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
