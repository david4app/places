import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { ImageCarousel } from '../Carousel/ImageCarousel';
import { RatingStars } from '../UI/RatingStars';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import type { Listing } from '../../types';

export function ListingCard({ listing }: { listing: Listing }) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(listing.id);

  const handleFavoriteClick = (event: MouseEvent) => {
    event.preventDefault();
    void toggleFavorite(listing.id);
  };

  return (
    <Link to={`/listing/${listing.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl mb-3 bg-gray-100">
        <ImageCarousel className="h-72 w-full" images={listing.images} alt={listing.title} />
        {user && (
          <button
            onClick={handleFavoriteClick}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm hover:scale-105 transition-transform"
          >
            {favorited ? <FaHeart className="text-primary" /> : <FaRegHeart className="text-gray-700" />}
          </button>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 group-hover:underline text-base line-clamp-2">
            {listing.title}
          </h3>
          <div className="shrink-0">
            <RatingStars rating={listing.rating} />
          </div>
        </div>
        <p className="text-sm text-gray-600">{listing.location}</p>
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">${listing.price}</span> night
        </p>
      </div>
    </Link>
  );
}
