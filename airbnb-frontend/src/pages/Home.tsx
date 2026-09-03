import { useEffect, useMemo, useRef, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { getListings } from '../api/client';
import { ListingCard } from '../components/Card/ListingCard';
import { ListingsMap } from '../components/Map/ListingsMap';
import { Input } from '../components/UI/Input';
import { getRecentlyViewedIds } from '../utils/recentlyViewed';
import type { Listing } from '../types';

const PAGE_SIZE = 8;

type SortOption = 'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'newest', label: 'Newest' },
];

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
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [showMap, setShowMap] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

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

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'rating':
        return list.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      default:
        return list;
    }
  }, [filtered, sortBy]);

  const recentlyViewed = useMemo(() => {
    const ids = getRecentlyViewedIds();
    return ids.map((id) => listings.find((listing) => listing.id === id)).filter((listing): listing is Listing => Boolean(listing));
  }, [listings]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, minPrice, maxPrice, minGuests, selectedAmenities, sortBy]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((current) => Math.min(current + PAGE_SIZE, sorted.length));
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sorted.length]);

  const visibleListings = sorted.slice(0, visibleCount);

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

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Recently viewed</h2>
          <div className="flex gap-6 overflow-x-auto pb-2">
            {recentlyViewed.map((listing) => (
              <div key={listing.id} className="w-64 shrink-0">
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Results Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Explore Stays</h2>
            <p className="text-gray-600">{sorted.length} amazing places to discover</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Sort by
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => setShowMap((current) => !current)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                showMap ? 'border-primary bg-primary text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {showMap ? 'Hide map' : 'Show map'}
            </button>
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
        ) : sorted.length > 0 ? (
          <div className={showMap ? 'grid gap-8 lg:grid-cols-[1fr_420px]' : ''}>
            <div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              {visibleCount < sorted.length && (
                <div ref={sentinelRef} className="flex justify-center py-10">
                  <p className="text-sm text-gray-500">Loading more stays…</p>
                </div>
              )}
            </div>
            {showMap && (
              <div className="hidden h-[600px] overflow-hidden rounded-2xl border border-gray-200 lg:sticky lg:top-24 lg:block">
                <ListingsMap listings={sorted} />
              </div>
            )}
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

