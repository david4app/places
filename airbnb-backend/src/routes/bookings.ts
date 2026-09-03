import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db.js';
import { getUserIdFromRequest } from '../session.js';
import { stripe } from '../stripe.js';
import type { BookingRecord, BookingWithListing, Message } from '../types.js';

const router = Router();

const CANCELLATION_CUTOFF_HOURS = 48;

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
  payment_status: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
};

type ListingRow = RowDataPacket & {
  id: string;
  title: string;
  location: string;
  images: string;
  host_name: string;
  host_user_id: string | null;
};

type MessageRow = RowDataPacket & {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
};

function toBooking(row: BookingRow): BookingRecord {
  return {
    id: row.id,
    listingId: row.listing_id,
    userId: row.user_id,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guests: row.guests,
    nights: row.nights,
    totalPrice: Number(row.total_price),
    status: row.status === 'cancelled' ? 'cancelled' : 'confirmed',
    paymentStatus: ['pending', 'paid', 'failed'].includes(row.payment_status) ? (row.payment_status as BookingRecord['paymentStatus']) : 'unpaid',
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    bookingId: row.booking_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderAvatar: row.sender_avatar,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function loadBookingWithListing(bookingId: string): Promise<{ booking: BookingRow; listing: ListingRow } | null> {
  const [bookingRows] = await pool.query<BookingRow[]>('SELECT * FROM bookings WHERE id = ?', [bookingId]);
  const booking = bookingRows[0];
  if (!booking) return null;

  const [listingRows] = await pool.query<ListingRow[]>(
    'SELECT id, title, location, images, host_name, host_user_id FROM listings WHERE id = ?',
    [booking.listing_id],
  );
  const listing = listingRows[0];
  if (!listing) return null;

  return { booking, listing };
}

router.get('/', async (_req, res) => {
  const [rows] = await pool.query<BookingRow[]>('SELECT * FROM bookings ORDER BY created_at DESC');
  res.json(rows.map(toBooking));
});

router.get('/mine', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to view your trips.' });
  }

  type TripRow = BookingRow & { title: string; location: string; images: string; host_name: string; host_user_id: string | null };
  const [rows] = await pool.query<TripRow[]>(
    `SELECT bookings.*, listings.title, listings.location, listings.images, listings.host_name, listings.host_user_id
     FROM bookings
     JOIN listings ON listings.id = bookings.listing_id
     WHERE bookings.user_id = ?
     ORDER BY bookings.check_in DESC`,
    [userId],
  );

  const trips: BookingWithListing[] = rows.map((row) => {
    const images = typeof row.images === 'string' ? JSON.parse(row.images) : row.images;
    return {
      ...toBooking(row),
      listing: {
        id: row.listing_id,
        title: row.title,
        location: row.location,
        image: Array.isArray(images) ? images[0] ?? null : null,
        hostName: row.host_name,
        hostUserId: row.host_user_id,
      },
    };
  });

  res.json(trips);
});

router.get('/:id', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to view this booking.' });
  }

  const found = await loadBookingWithListing(req.params.id);
  if (!found) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  const { booking, listing } = found;
  if (booking.user_id !== userId && listing.host_user_id !== userId) {
    return res.status(403).json({ message: 'You do not have access to this booking.' });
  }

  const images = typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images;
  const response: BookingWithListing = {
    ...toBooking(booking),
    listing: {
      id: listing.id,
      title: listing.title,
      location: listing.location,
      image: Array.isArray(images) ? images[0] ?? null : null,
      hostName: listing.host_name,
      hostUserId: listing.host_user_id,
    },
  };

  res.json(response);
});

router.post('/', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to book a stay.' });
  }

  const { listingId, checkIn, checkOut, guests } = req.body ?? {};

  if (!listingId || !checkIn || !checkOut || !guests) {
    return res.status(400).json({ message: 'Missing required booking fields' });
  }

  type ListingPriceRow = RowDataPacket & { price: string; max_guests: number };
  const [listingRows] = await pool.query<ListingPriceRow[]>(
    'SELECT price, max_guests FROM listings WHERE id = ?',
    [listingId],
  );
  const listing = listingRows[0];
  if (!listing) {
    return res.status(404).json({ message: 'Listing not found' });
  }

  const nights = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000);
  if (!Number.isFinite(nights) || nights < 1) {
    return res.status(400).json({ message: 'Check-out must be after check-in' });
  }

  const numericGuests = Number(guests);
  if (!Number.isInteger(numericGuests) || numericGuests < 1 || numericGuests > listing.max_guests) {
    return res.status(400).json({ message: `Guests must be between 1 and ${listing.max_guests}` });
  }

  const [conflicts] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM bookings
     WHERE listing_id = ? AND status != 'cancelled' AND check_in < ? AND check_out > ?`,
    [listingId, checkOut, checkIn],
  );
  if (conflicts.length > 0) {
    return res.status(409).json({ message: 'This listing is already booked for some of the selected dates.' });
  }

  const booking: BookingRecord = {
    id: randomUUID(),
    listingId,
    userId,
    checkIn,
    checkOut,
    guests: numericGuests,
    nights,
    totalPrice: nights * Number(listing.price),
    status: 'confirmed',
    paymentStatus: 'unpaid',
    createdAt: new Date().toISOString(),
  };

  await pool.query(
    `INSERT INTO bookings (id, listing_id, user_id, check_in, check_out, guests, nights, total_price, status, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [booking.id, booking.listingId, booking.userId, booking.checkIn, booking.checkOut, booking.guests, booking.nights, booking.totalPrice, booking.status, booking.paymentStatus],
  );

  res.status(201).json(booking);
});

router.post('/:id/cancel', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to cancel a booking.' });
  }

  const [rows] = await pool.query<BookingRow[]>('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
  const booking = rows[0];
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  if (booking.user_id !== userId) {
    return res.status(403).json({ message: 'You can only cancel your own trips.' });
  }
  if (booking.status === 'cancelled') {
    return res.status(409).json({ message: 'This booking has already been cancelled.' });
  }

  const hoursUntilCheckIn = (new Date(booking.check_in).getTime() - Date.now()) / (60 * 60 * 1000);
  if (hoursUntilCheckIn < CANCELLATION_CUTOFF_HOURS) {
    return res.status(409).json({
      message: `Free cancellation is only available until ${CANCELLATION_CUTOFF_HOURS} hours before check-in.`,
    });
  }

  await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [booking.id]);
  res.json(toBooking({ ...booking, status: 'cancelled' }));
});

router.post('/:id/create-payment-intent', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ message: 'Payments are not configured yet. Set STRIPE_SECRET_KEY on the server.' });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to pay for a booking.' });
  }

  const [rows] = await pool.query<BookingRow[]>('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
  const booking = rows[0];
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  if (booking.user_id !== userId) {
    return res.status(403).json({ message: 'You can only pay for your own bookings.' });
  }
  if (booking.status === 'cancelled') {
    return res.status(409).json({ message: 'This booking has been cancelled.' });
  }
  if (booking.payment_status === 'paid') {
    return res.status(409).json({ message: 'This booking has already been paid.' });
  }

  const amountInCents = Math.round(Number(booking.total_price) * 100);

  let clientSecret: string | null;
  if (booking.stripe_payment_intent_id) {
    const existing = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
    clientSecret = existing.status === 'succeeded' ? null : existing.client_secret;
  } else {
    const intent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { bookingId: booking.id },
    });
    await pool.query("UPDATE bookings SET stripe_payment_intent_id = ?, payment_status = 'pending' WHERE id = ?", [intent.id, booking.id]);
    clientSecret = intent.client_secret;
  }

  if (!clientSecret) {
    return res.status(409).json({ message: 'This booking has already been paid.' });
  }

  res.json({ clientSecret });
});

router.post('/:id/confirm-payment', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ message: 'Payments are not configured yet. Set STRIPE_SECRET_KEY on the server.' });
  }

  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to confirm a payment.' });
  }

  const [rows] = await pool.query<BookingRow[]>('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
  const booking = rows[0];
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  if (booking.user_id !== userId) {
    return res.status(403).json({ message: 'You can only confirm payment for your own bookings.' });
  }
  if (!booking.stripe_payment_intent_id) {
    return res.status(400).json({ message: 'No payment has been started for this booking.' });
  }

  const intent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
  const paymentStatus = intent.status === 'succeeded' ? 'paid' : intent.status === 'canceled' ? 'failed' : 'pending';

  await pool.query('UPDATE bookings SET payment_status = ? WHERE id = ?', [paymentStatus, booking.id]);
  res.json(toBooking({ ...booking, payment_status: paymentStatus }));
});

router.get('/:id/messages', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to view messages.' });
  }

  const found = await loadBookingWithListing(req.params.id);
  if (!found) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  const { booking, listing } = found;
  if (booking.user_id !== userId && listing.host_user_id !== userId) {
    return res.status(403).json({ message: 'You do not have access to this conversation.' });
  }

  const [rows] = await pool.query<MessageRow[]>(
    `SELECT messages.*, users.name AS sender_name, users.avatar AS sender_avatar
     FROM messages
     JOIN users ON users.id = messages.sender_id
     WHERE messages.booking_id = ?
     ORDER BY messages.created_at ASC`,
    [req.params.id],
  );

  res.json(rows.map(toMessage));
});

router.post('/:id/messages', async (req, res) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return res.status(401).json({ message: 'You must be logged in to send messages.' });
  }

  const found = await loadBookingWithListing(req.params.id);
  if (!found) {
    return res.status(404).json({ message: 'Booking not found' });
  }
  const { booking, listing } = found;
  if (booking.user_id !== userId && listing.host_user_id !== userId) {
    return res.status(403).json({ message: 'You do not have access to this conversation.' });
  }

  const body = String(req.body?.body ?? '').trim();
  if (!body) {
    return res.status(400).json({ message: 'Message cannot be empty.' });
  }

  const id = randomUUID();
  await pool.query(
    'INSERT INTO messages (id, booking_id, sender_id, body) VALUES (?, ?, ?, ?)',
    [id, booking.id, userId, body],
  );

  type UserRow = RowDataPacket & { name: string; avatar: string };
  const [userRows] = await pool.query<UserRow[]>('SELECT name, avatar FROM users WHERE id = ?', [userId]);
  const sender = userRows[0];

  const message: Message = {
    id,
    bookingId: booking.id,
    senderId: userId,
    senderName: sender?.name ?? 'Unknown',
    senderAvatar: sender?.avatar ?? '',
    body,
    createdAt: new Date().toISOString(),
  };

  res.status(201).json(message);
});

export default router;
