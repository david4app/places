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

export type BookingWithListing = BookingRecord & {
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

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
};
