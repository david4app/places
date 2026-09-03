import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { useAuth } from '../context/AuthContext';
import { createListing } from '../api/client';

export function Host() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [maxGuests, setMaxGuests] = useState('2');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState('');
  const [images, setImages] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('You must be logged in to create a listing.');
      return;
    }

    const imageList = images.split('\n').map((line) => line.trim()).filter(Boolean);
    const amenityList = amenities.split(',').map((item) => item.trim()).filter(Boolean);

    setSubmitting(true);
    try {
      const listing = await createListing(
        {
          title,
          location,
          description,
          price: Number(price),
          maxGuests: Number(maxGuests),
          amenities: amenityList,
          images: imageList,
        },
        token,
      );
      navigate(`/listing/${listing.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-4xl font-bold text-gray-900">Become a host</h1>
        <p className="mb-8 text-gray-600">List your place and start welcoming guests.</p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700">
            Title
            <Input className="mt-2 rounded-lg" required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Cozy cabin with a view" />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Location
            <Input className="mt-2 rounded-lg" required value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Big Sur, California" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Price per night ($)
              <Input className="mt-2 rounded-lg" type="number" min="1" required value={price} onChange={(event) => setPrice(event.target.value)} />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Max guests
              <Input className="mt-2 rounded-lg" type="number" min="1" required value={maxGuests} onChange={(event) => setMaxGuests(event.target.value)} />
            </label>
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Description
            <textarea
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={4}
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Tell guests what makes this place special..."
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Amenities (comma separated)
            <Input className="mt-2 rounded-lg" value={amenities} onChange={(event) => setAmenities(event.target.value)} placeholder="Wifi, Free parking, Kitchen" />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Image URLs (one per line)
            <textarea
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={3}
              required
              value={images}
              onChange={(event) => setImages(event.target.value)}
              placeholder="https://example.com/photo1.jpg"
            />
          </label>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full text-lg py-4">
            {submitting ? 'Publishing…' : 'Publish listing'}
          </Button>
        </form>
      </div>
    </main>
  );
}
