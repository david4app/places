import { Router } from 'express';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db.js';
import { getUserIdFromRequest } from '../session.js';
import type { Listing } from '../types.js';

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
  host_verified: number;
  host_response_time: string;
  lat: string | null;
  lng: string | null;
  created_at: string;
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
    lat: row.lat !== null && row.lat !== undefined ? Number(row.lat) : null,
    lng: row.lng !== null && row.lng !== undefined ? Number(row.lng) : null,
    createdAt: new Date(row.created_at).toISOString(),
    host: {
      name: row.host_name,
      avatar: row.host_avatar,
      verified: Boolean(row.host_verified),
      responseTime: row.host_response_time,
    },
  };
}

router.get('/', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to view favorites.' });
  }

  const [rows] = await pool.query<ListingRow[]>(
    `SELECT listings.* FROM favorites
     JOIN listings ON listings.id = favorites.listing_id
     WHERE favorites.user_id = ?
     ORDER BY favorites.created_at DESC`,
    [userId],
  );
  res.json(rows.map(toListing));
});

router.post('/:listingId', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to save favorites.' });
  }

  const [listingRows] = await pool.query<RowDataPacket[]>('SELECT id FROM listings WHERE id = ?', [req.params.listingId]);
  if (listingRows.length === 0) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  await pool.query('INSERT IGNORE INTO favorites (user_id, listing_id) VALUES (?, ?)', [userId, req.params.listingId]);
  res.status(201).json({ message: 'Added to favorites.' });
});

router.delete('/:listingId', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to manage favorites.' });
  }

  await pool.query('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?', [userId, req.params.listingId]);
  res.status(204).send();
});

export default router;
