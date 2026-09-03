import { pool } from './db.js';
import { listings } from './data/listings.js';
import { toMysqlDatetime } from './utils.js';

async function seed() {
  for (const listing of listings) {
    await pool.query(
      `INSERT INTO listings (id, title, location, price, rating, images, description, amenities, max_guests, host_name, host_avatar, host_verified, host_response_time, lat, lng, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title), location = VALUES(location), price = VALUES(price), rating = VALUES(rating),
         images = VALUES(images), description = VALUES(description), amenities = VALUES(amenities),
         max_guests = VALUES(max_guests), host_name = VALUES(host_name), host_avatar = VALUES(host_avatar),
         host_verified = VALUES(host_verified), host_response_time = VALUES(host_response_time),
         lat = VALUES(lat), lng = VALUES(lng), created_at = VALUES(created_at)`,
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
        listing.host.verified ? 1 : 0,
        listing.host.responseTime,
        listing.lat,
        listing.lng,
        toMysqlDatetime(listing.createdAt),
      ],
    );
  }
  console.log(`Seeded ${listings.length} listings.`);
  await pool.end();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
