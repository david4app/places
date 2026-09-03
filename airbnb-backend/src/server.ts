import express from 'express';
import cors from 'cors';
import path from 'node:path';
import listingsRouter from './routes/listings.js';
import bookingsRouter from './routes/bookings.js';
import authRouter from './routes/auth.js';
import favoritesRouter from './routes/favorites.js';
import uploadsRouter from './routes/uploads.js';
import geocodeRouter from './routes/geocode.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/listings', listingsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/auth', authRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/geocode', geocodeRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => {
  console.log(`airbnb-backend listening on http://localhost:${PORT}`);
});
