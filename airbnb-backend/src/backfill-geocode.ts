import type { RowDataPacket } from 'mysql2';
import { pool } from './db.js';
import { geocodeLocation } from './geocode.js';

async function backfill() {
  const [rows] = await pool.query<(RowDataPacket & { id: string; location: string })[]>(
    'SELECT id, location FROM listings WHERE lat IS NULL OR lng IS NULL',
  );

  for (const row of rows) {
    const coordinates = await geocodeLocation(row.location);
    if (!coordinates) {
      console.log(`Could not geocode "${row.location}" (listing ${row.id})`);
      continue;
    }
    await pool.query('UPDATE listings SET lat = ?, lng = ? WHERE id = ?', [coordinates.lat, coordinates.lng, row.id]);
    console.log(`Geocoded "${row.location}" -> ${coordinates.lat}, ${coordinates.lng}`);
  }

  console.log(`Done. Checked ${rows.length} listing(s) missing coordinates.`);
  await pool.end();
}

backfill().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
