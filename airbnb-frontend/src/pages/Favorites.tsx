import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { ListingCard } from '../components/Card/ListingCard';

export function Favorites() {
  const { favorites } = useFavorites();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Your favorites</h1>

        {favorites.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 border-dashed p-12 text-center">
            <p className="text-xl text-gray-600 mb-2">No favorites yet</p>
            <p className="text-gray-500 mb-6">Tap the heart on any stay to save it here</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Explore stays
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
