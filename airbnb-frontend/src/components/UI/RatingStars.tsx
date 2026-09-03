import { FaStar } from 'react-icons/fa';

export function RatingStars({ rating }: { rating: number }) {
  return (
    <div aria-label={`${rating} out of 5 stars`} className="inline-flex items-center gap-1">
      <FaStar className="text-gray-900" size={14} />
      <span className="text-sm font-semibold text-gray-900">{rating.toFixed(2)}</span>
    </div>
  );
}
