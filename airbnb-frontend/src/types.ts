export type Listing = {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  images: string[];
  description: string;
  amenities: string[];
  maxGuests: number;
  host: { name: string; avatar: string };
};

export type User = { id: string; name: string; email: string; avatar: string };

export type AuthResponse = { token: string; user: User };

export type CreateListingRequest = {
  title: string;
  location: string;
  price: number;
  description: string;
  amenities: string[];
  maxGuests: number;
  images: string[];
};

export type BookingRequest = {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export type BookingStatus = 'confirmed' | 'cancelled';

export type BookingRecord = BookingRequest & {
  id: string;
  nights: number;
  totalPrice: number;
  createdAt: string;
  status: BookingStatus;
  userId: string | null;
};

export type TripRecord = BookingRecord & {
  listing: {
    id: string;
    title: string;
    location: string;
    image: string | null;
    hostName: string;
    hostUserId: string | null;
  };
};

export type AvailabilityRange = {
  checkIn: string;
  checkOut: string;
};

export type Message = {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  body: string;
  createdAt: string;
};

export type Review = {
  id: string;
  listingId: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: { name: string; avatar: string };
};

export type CreateReviewRequest = {
  rating: number;
  comment: string;
};
