import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db.js';
import { getUserIdFromRequest } from '../session.js';
import type { BookingRecord, Listing, Review } from '../types.js';

const router = Router();

type ListingRow = RowDataPacket & {
  id: string;
  title: string;
  location: string;
  price: string;
  rating: string;
  images: string;
  description: string;
  amenities: string;
  max_guests: number;
  host_name: string;
  host_avatar: string;
  host_user_id: string | null;
};

function toListing(row: ListingRow): Listing {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    price: Number(row.price),
    rating: Number(row.rating),
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
    description: row.description,
    amenities: typeof row.amenities === 'string' ? JSON.parse(row.amenities) : row.amenities,
    maxGuests: row.max_guests,
    host: { name: row.host_name, avatar: row.host_avatar },
  };
}

router.get('/', async (_req, res) => {
  const [rows] = await pool.query<ListingRow[]>('SELECT * FROM listings');
  res.json(rows.map(toListing));
});

router.get('/mine', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to view your listings.' });
  }
  const [rows] = await pool.query<ListingRow[]>('SELECT * FROM listings WHERE host_user_id = ?', [userId]);
  res.json(rows.map(toListing));
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query<ListingRow[]>('SELECT * FROM listings WHERE id = ?', [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  res.json(toListing(rows[0]));
});

router.get('/:id/availability', async (req, res) => {
  const [listingRows] = await pool.query<ListingRow[]>('SELECT id FROM listings WHERE id = ?', [req.params.id]);
  if (listingRows.length === 0) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  type RangeRow = RowDataPacket & { check_in: string; check_out: string };
  const [rows] = await pool.query<RangeRow[]>(
    `SELECT check_in, check_out FROM bookings
     WHERE listing_id = ? AND status != 'cancelled'
     ORDER BY check_in ASC`,
    [req.params.id],
  );

  res.json(rows.map((row) => ({ checkIn: row.check_in, checkOut: row.check_out })));
});

router.get('/:id/bookings', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to view bookings.' });
  }

  const [listingRows] = await pool.query<ListingRow[]>('SELECT host_user_id FROM listings WHERE id = ?', [req.params.id]);
  const listing = listingRows[0];
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  if (listing.host_user_id !== userId) {
    return res.status(403).json({ message: 'You can only view bookings for your own listings.' });
  }

  type BookingRow = RowDataPacket & {
    id: string;
    listing_id: string;
    user_id: string | null;
    check_in: string;
    check_out: string;
    guests: number;
    nights: number;
    total_price: string;
    status: string;
    created_at: string;
  };

  const [rows] = await pool.query<BookingRow[]>(
    'SELECT * FROM bookings WHERE listing_id = ? ORDER BY check_in ASC',
    [req.params.id],
  );

  const bookings: BookingRecord[] = rows.map((row) => ({
    id: row.id,
    listingId: row.listing_id,
    userId: row.user_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    nights: row.nights,
    totalPrice: Number(row.total_price),
    status: row.status === 'cancelled' ? 'cancelled' : 'confirmed',
    createdAt: new Date(row.created_at).toISOString(),
  }));

  res.json(bookings);
});

router.get('/:id/reviews', async (req, res) => {
  type ReviewRow = RowDataPacket & {
    id: string;
    listing_id: string;
    rating: number;
    comment: string;
    created_at: string;
    reviewer_name: string;
    reviewer_avatar: string;
  };

  const [rows] = await pool.query<ReviewRow[]>(
    `SELECT reviews.id, reviews.listing_id, reviews.rating, reviews.comment, reviews.created_at,
            users.name AS reviewer_name, users.avatar AS reviewer_avatar
     FROM reviews
     JOIN users ON users.id = reviews.user_id
     WHERE reviews.listing_id = ?
     ORDER BY reviews.created_at DESC`,
    [req.params.id],
  );

  const reviews: Review[] = rows.map((row) => ({
    id: row.id,
    listingId: row.listing_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.created_at).toISOString(),
    reviewer: { name: row.reviewer_name, avatar: row.reviewer_avatar },
  }));

  res.json(reviews);
});

router.post('/:id/reviews', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to leave a review.' });
  }

  const [listingRows] = await pool.query<ListingRow[]>('SELECT id FROM listings WHERE id = ?', [req.params.id]);
  if (listingRows.length === 0) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  const rating = Number(req.body?.rating);
  const comment = String(req.body?.comment ?? '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be a whole number between 1 and 5.' });
  }
  if (!comment) {
    return res.status(400).json({ message: 'Please write a comment for your review.' });
  }

  try {
    await pool.query(
      'INSERT INTO reviews (id, listing_id, user_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [randomUUID(), req.params.id, userId, rating, comment],
    );
  } catch (error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You have already reviewed this listing.' });
    }
    throw error;
  }

  res.status(201).json({ message: 'Review submitted.' });
});

router.delete('/:id', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to delete a listing.' });
  }

  const [rows] = await pool.query<ListingRow[]>('SELECT host_user_id FROM listings WHERE id = ?', [req.params.id]);
  const listing = rows[0];
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }
  if (listing.host_user_id !== userId) {
    return res.status(403).json({ message: 'You can only delete your own listings.' });
  }

  await pool.query('DELETE FROM favorites WHERE listing_id = ?', [req.params.id]);
  await pool.query('DELETE FROM reviews WHERE listing_id = ?', [req.params.id]);
  await pool.query('DELETE FROM bookings WHERE listing_id = ?', [req.params.id]);
  await pool.query('DELETE FROM listings WHERE id = ?', [req.params.id]);

  res.status(204).send();
});

router.post('/', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to create a listing.' });
  }

  type UserRow = RowDataPacket & { name: string; avatar: string };
  const [userRows] = await pool.query<UserRow[]>('SELECT name, avatar FROM users WHERE id = ?', [userId]);
  const host = userRows[0];
  if (!host) {
    return res.status(401).json({ message: 'Your session is no longer valid. Please log in again.' });
  }

  const { title, location, price, description, amenities, maxGuests, images } = req.body ?? {};

  if (!String(title ?? '').trim() || !String(location ?? '').trim() || !String(description ?? '').trim()) {
    return res.status(400).json({ message: 'Title, location, and description are required.' });
  }

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ message: 'Price must be a positive number.' });
  }

  const numericMaxGuests = Number(maxGuests);
  if (!Number.isInteger(numericMaxGuests) || numericMaxGuests < 1) {
    return res.status(400).json({ message: 'Max guests must be a positive whole number.' });
  }

  const imageList = Array.isArray(images) ? images.filter((url) => typeof url === 'string' && url.trim()) : [];
  if (imageList.length === 0) {
    return res.status(400).json({ message: 'Please provide at least one image URL.' });
  }

  const amenityList = Array.isArray(amenities) ? amenities.filter((item) => typeof item === 'string' && item.trim()) : [];

  const listing: Listing = {
    id: randomUUID(),
    title: String(title).trim(),
    location: String(location).trim(),
    price: numericPrice,
    rating: 5,
    images: imageList,
    description: String(description).trim(),
    amenities: amenityList,
    maxGuests: numericMaxGuests,
    host: { name: host.name, avatar: host.avatar },
  };

  await pool.query(
    `INSERT INTO listings (id, title, location, price, rating, images, description, amenities, max_guests, host_name, host_avatar, host_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      listing.id,
      listing.title,
      listing.location,
      listing.price,
      listing.rating,
      JSON.stringify(listing.images),
      listing.description,
      JSON.stringify(listing.amenities),
      listing.maxGuests,
      listing.host.name,
      listing.host.avatar,
      userId,
    ],
  );

  res.status(201).json(listing);
});

export default router;
