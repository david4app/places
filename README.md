# StayBNB - Airbnb Clone

A full-stack vacation rental booking app built with React + TypeScript + Vite on the frontend and Express + TypeScript on the backend.

## Features

- **Browse Listings**: Search and filter vacation rentals by location or title
- **View Details**: See full listing details with image carousel, amenities, and host info
- **Book a Stay**: Reserve with date range and guest count, with instant price calculation
- **View Trips**: Track all your confirmed bookings in your profile
- **Responsive Design**: Mobile-first Tailwind CSS styling

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- React Router v6 (routing)
- Tailwind CSS (styling)
- date-fns (date calculations)
- react-icons (icons)

### Backend
- Express + TypeScript
- CORS enabled
- In-memory data storage (ready for a database)

## Getting Started

### Frontend

```bash
cd airbnb-frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and will open automatically.

### Backend

```bash
cd airbnb-backend
npm install
npm run dev
```

The backend runs on `http://localhost:4000`.

### Build for Production

```bash
# Frontend
cd airbnb-frontend
npm run build
npm run preview

# Backend
cd airbnb-backend
npm run build
npm start
```

## API Endpoints

- `GET /api/listings` - List all vacation rentals
- `GET /api/listings/:id` - Get a specific listing
- `GET /api/listings/:id/availability` - Get blocked-out date ranges for a listing
- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create a new booking (auth required)
- `GET /api/bookings/mine` - List the current user's trips (auth required)
- `GET /api/bookings/:id` - Get a booking (guest or host, auth required)
- `POST /api/bookings/:id/cancel` - Cancel a trip if more than 48h before check-in (auth required)
- `GET /api/bookings/:id/messages` - List a booking's message thread (auth required)
- `POST /api/bookings/:id/messages` - Send a message on a booking thread (auth required)

## File Structure

```
airbnb-frontend/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/           # Page components (Home, Listing Detail, etc.)
│   ├── context/         # React Context for state management
│   ├── api/             # API client functions
│   ├── mockData/        # Mock listings and users
│   ├── types.ts         # Shared TypeScript types
│   └── main.tsx         # Entry point

airbnb-backend/
├── src/
│   ├── routes/          # Express route handlers
│   ├── data/            # Mock data (listings, bookings)
│   ├── types.ts         # Shared TypeScript types
│   └── server.ts        # Express server setup
```

## Notes

- The backend stores bookings in memory. Restart the server to reset.
- The frontend gracefully falls back to local state if the backend is unavailable.
- All mock images are from picsum.photos (placeholder service).
