import { useEffect, useMemo, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { getListings } from '../api/client';
import { ListingCard } from '../components/Card/ListingCard';
import { Input } from '../components/UI/Input';
import type { Listing } from '../types';

export function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minGuests, setMinGuests] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getListings()
      .then(setListings)
      .catch(() => setError('Could not load stays. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const allAmenities = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((listing) => listing.amenities.forEach((amenity) => set.add(amenity)));
    return Array.from(set).sort();
  }, [listings]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((current) =>
      current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity]
    );
  };

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    const guests = minGuests ? Number(minGuests) : null;

    return listings.filter((listing) => {
      if (search && !listing.title.toLowerCase().includes(search) && !listing.location.toLowerCase().includes(search)) {
        return false;
      }
      if (min !== null && listing.price < min) return false;
      if (max !== null && listing.price > max) return false;
      if (guests !== null && listing.maxGuests < guests) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every((amenity) => listing.amenities.includes(amenity))) {
        return false;
      }
      return true;
    });
  }, [query, listings, minPrice, maxPrice, minGuests, selectedAmenities]);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-sky-50 via-blue-50 to-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="mb-4 text-5xl font-bold sm:text-6xl text-gray-900">
              Not sure where to go?
            </h1>
            <p className="text-xl text-gray-600">Perfect. Let Staybnb inspire you.</p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="bg-white rounded-full shadow-lg p-1 flex items-center">
              <input
                type="text"
                placeholder="Search by location or listing name..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="flex-1 px-6 py-3 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <button className="bg-primary hover:bg-primary/90 text-white rounded-full p-3 mr-1 transition-colors">
                <FaSearch className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => setShowFilters((current) => !current)}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 underline"
            >
              {showFilters ? 'Hide filters' : 'Show filters'}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm font-medium text-gray-700">
                  Min price
                  <Input
                    type="number"
                    min="0"
                    className="mt-2 rounded-lg"
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="$0"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Max price
                  <Input
                    type="number"
                    min="0"
                    className="mt-2 rounded-lg"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="Any"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Guests
                  <Input
                    type="number"
                    min="1"
                    className="mt-2 rounded-lg"
                    value={minGuests}
                    onChange={(event) => setMinGuests(event.target.value)}
                    placeholder="Any"
                  />
                </label>
              </div>

              {allAmenities.length > 0 && (
                <div className="mt-4 text-left">
                  <p className="mb-2 text-sm font-medium text-gray-700">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {allAmenities.map((amenity) => (
                      <button
                        key={amenity}
                        onClick={() => toggleAmenity(amenity)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          selectedAmenities.includes(amenity)
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Explore Stays</h2>
            <p className="text-gray-600">{filtered.length} amazing places to discover</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-xl text-gray-600">Loading stays…</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-xl text-red-600">{error}</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-xl text-gray-600 mb-4">No stays match "{query}"</p>
            <p className="text-gray-500">Try searching for a different destination</p>
          </div>
        )}
      </section>
    </main>
  );
}
