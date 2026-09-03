-- Run this once against your MySQL server to create the schema.
-- Example: mysql -u root -p < src/schema.sql

CREATE DATABASE IF NOT EXISTS airbnb;
USE airbnb;

CREATE TABLE IF NOT EXISTS listings (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  rating DECIMAL(3, 2) NOT NULL,
  images JSON NOT NULL,
  description TEXT NOT NULL,
  amenities JSON NOT NULL,
  max_guests INT NOT NULL,
  host_name VARCHAR(255) NOT NULL,
  host_avatar VARCHAR(512) NOT NULL,
  host_user_id VARCHAR(36) NULL,
  host_verified TINYINT(1) NOT NULL DEFAULT 0,
  host_response_time VARCHAR(50) NOT NULL DEFAULT 'Within a few hours',
  lat DECIMAL(10, 7) NULL,
  lng DECIMAL(10, 7) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Idempotent upgrades for databases created before these columns existed.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS host_verified TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS host_response_time VARCHAR(50) NOT NULL DEFAULT 'Within a few hours';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 7) NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS lng DECIMAL(10, 7) NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  surname VARCHAR(255) NULL,
  phone VARCHAR(30) NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  avatar VARCHAR(512) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_token VARCHAR(64) NULL,
  verification_token_expires TIMESTAMP NULL,
  reset_token VARCHAR(64) NULL,
  reset_token_expires TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Idempotent upgrades for databases created before these columns existed.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(64) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS surname VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NULL;

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INT NOT NULL,
  nights INT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  stripe_payment_intent_id VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_listing FOREIGN KEY (listing_id) REFERENCES listings(id)
);

-- Idempotent upgrades for databases created before these columns existed.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id VARCHAR(36) NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'confirmed';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS favorites (
  user_id VARCHAR(36) NOT NULL,
  listing_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, listing_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_favorites_listing FOREIGN KEY (listing_id) REFERENCES listings(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(36) PRIMARY KEY,
  listing_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  rating INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_listing FOREIGN KEY (listing_id) REFERENCES listings(id),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT uq_reviews_listing_user UNIQUE (listing_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id)
);
