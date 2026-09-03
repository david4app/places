import { randomUUID } from 'node:crypto';
import { pool } from './db.js';
import { hashPassword } from './auth-utils.js';

const demoUsers = [
  { name: 'Alex Morgan', email: 'alex@example.com', password: 'password123' },
  { name: 'Priya Sharma', email: 'priya@example.com', password: 'password123' },
  { name: 'Liam O\u2019Connor', email: 'liam@example.com', password: 'password123' },
  { name: 'Sofia Rossi', email: 'sofia@example.com', password: 'password123' },
  { name: 'Kenji Tanaka', email: 'kenji@example.com', password: 'password123' },
];

async function seed() {
  for (const user of demoUsers) {
    const avatar = `https://i.pravatar.cc/160?u=${encodeURIComponent(user.email)}`;
    await pool.query(
      `INSERT INTO users (id, name, email, avatar, password_hash)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), avatar = VALUES(avatar)`,
      [randomUUID(), user.name, user.email, avatar, hashPassword(user.password)],
    );
  }
  console.log(`Seeded ${demoUsers.length} users. All demo accounts use password: password123`);
  await pool.end();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
