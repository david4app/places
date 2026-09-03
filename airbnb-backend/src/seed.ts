import { pool } from './db.js';
import { listings } from './data/listings.js';

async function seed() {
  for (const listing of listings) {
    await pool.query(
      `INSERT INTO listings (id, title, location, price, rating, images, description, amenities, max_guests, host_name, host_avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title), location = VALUES(location), price = VALUES(price), rating = VALUES(rating),
         images = VALUES(images), description = VALUES(description), amenities = VALUES(amenities),
         max_guests = VALUES(max_guests), host_name = VALUES(host_name), host_avatar = VALUES(host_avatar)`,
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
