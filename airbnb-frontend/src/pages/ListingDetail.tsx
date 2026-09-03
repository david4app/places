import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaCheckCircle } from 'react-icons/fa';
import { getListing, getReviews, addReview, getListingAvailability } from '../api/client';
import { Button } from '../components/UI/Button';
import { RatingStars } from '../components/UI/RatingStars';
import { ImageCarousel } from '../components/Carousel/ImageCarousel';
import { AvailabilityCalendar } from '../components/Calendar/AvailabilityCalendar';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { recordRecentlyViewed } from '../utils/recentlyViewed';
import type { AvailabilityRange, Listing, Review } from '../types';

export function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [blockedRanges, setBlockedRanges] = useState<AvailabilityRange[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const { user, token } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();

  useEffect(() => {
    if (!id) return;
    getListing(id)
      .then((found) => {
        setListing(found);
        if (found) recordRecentlyViewed(found.id);
      })
      .catch(() => setListing(null));
    getReviews(id)
      .then(setReviews)
      .catch(() => setReviews([]));
    getListingAvailability(id)
      .then(setBlockedRanges)
      .catch(() => setBlockedRanges([]));
  }, [id]);

  const handleReviewSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !token) return;
    setSubmittingReview(true);
    try {
      await addReview(id, { rating: reviewRating, comment: reviewComment }, token);
      setReviewComment('');
      setReviewRating(5);
      const updated = await getReviews(id);
      setReviews(updated);
      showToast('Review submitted. Thanks!');
    } catch (submitError) {
      showToast(submitError instanceof Error ? submitError.message : 'Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (listing === undefined) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading…</p>
      </main>
    );
  }

  if (!listing) {
    return <Navigate to="/404" replace />;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link to="/" className="mb-6 inline-flex text-gray-600 hover:text-gray-900 transition-colors">
          ← Back to stays
        </Link>

        {/* Gallery */}
        <div className="mb-8 rounded-3xl overflow-hidden">
          <ImageCarousel className="h-96 w-full sm:h-[500px]" images={listing.images} alt={listing.title} />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-gray-600">{listing.location}</p>
                {user && (
                  <button
                    onClick={() => void toggleFavorite(listing.id)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    {isFavorite(listing.id) ? <FaHeart className="text-primary" /> : <FaRegHeart />}
                    {isFavorite(listing.id) ? 'Saved' : 'Save'}
                  </button>
                )}
              </div>
              <h1 className="mb-4 text-4xl font-bold text-gray-900">{listing.title}</h1>
              <div className="flex items-center gap-4">
                <RatingStars rating={listing.rating} />
                <span className="text-sm text-gray-600">·</span>
                <span className="text-sm text-gray-600">{listing.maxGuests} guests</span>
              </div>
            </div>

            {/* Host Info */}
            <div className="flex items-center gap-4 border-t border-gray-200 pt-8">
              <img 
                className="h-16 w-16 rounded-full object-cover" 
                src={listing.host.avatar} 
                alt={listing.host.name} 
              />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">Hosted by {listing.host.name}</p>
                  {listing.host.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <FaCheckCircle /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Responds {listing.host.responseTime.toLowerCase()} · {listing.maxGuests} guests max</p>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">About this place</h2>
              <p className="text-lg text-gray-700 leading-relaxed">{listing.description}</p>
            </div>

            {/* Amenities */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">What this place offers</h2>
              <ul className="grid grid-cols-2 gap-4">
                {listing.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-3 text-gray-700">
                    <span className="text-primary text-lg">✓</span>
                    {amenity}
                  </li>
                ))}
              </ul>
            </div>
            {/* Availability */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Availability</h2>
              <AvailabilityCalendar blockedRanges={blockedRanges} />
            </div>

            {/* Reviews */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">
                Reviews {reviews.length > 0 && `(${reviews.length})`}
              </h2>

              {reviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet.</p>
              ) : (
                <ul className="space-y-6">
                  {reviews.map((review) => (
                    <li key={review.id} className="flex gap-4">
                      <img src={review.reviewer.avatar} alt={review.reviewer.name} className="h-10 w-10 rounded-full object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{review.reviewer.name}</p>
                          <RatingStars rating={review.rating} />
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {user && (
                <form onSubmit={handleReviewSubmit} className="mt-8 space-y-4 border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700">
                    Your rating
                    <select
                      value={reviewRating}
                      onChange={(event) => setReviewRating(Number(event.target.value))}
                      className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} star{value > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    Your review
                    <textarea
                      required
                      rows={3}
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Share your experience..."
                    />
                  </label>
                  <Button type="submit" disabled={submittingReview}>
                    {submittingReview ? 'Submitting…' : 'Submit review'}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div>
            <div className="sticky top-24 rounded-2xl border border-gray-200 p-6 shadow-lg">
              <div className="mb-6">
                <p className="text-3xl font-bold text-gray-900">
                  ${listing.price}
                </p>
                <p className="text-sm text-gray-600">per night</p>
              </div>

              <Link to={`/booking/${listing.id}`} className="block mb-4">
                <Button className="w-full">Reserve</Button>
              </Link>

              <p className="mb-4 text-center text-sm text-gray-600">You won't be charged yet</p>

              <div className="space-y-3 border-t border-gray-200 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating</span>
                  <span className="font-semibold text-gray-900">{listing.rating.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests allowed</span>
                  <span className="font-semibold text-gray-900">Up to {listing.maxGuests}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
