import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { ImageListEditor } from '../components/UI/ImageListEditor';
import { LocationAutocomplete } from '../components/UI/LocationAutocomplete';
import { useAuth } from '../context/AuthContext';
import { getListing, updateListing } from '../api/client';
import type { Listing } from '../types';

export function EditListing() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [maxGuests, setMaxGuests] = useState('2');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getListing(id)
      .then((found) => {
        setListing(found);
        if (found) {
          setTitle(found.title);
          setLocation(found.location);
          setPrice(String(found.price));
          setMaxGuests(String(found.maxGuests));
          setDescription(found.description);
          setAmenities(found.amenities.join(', '));
          setImages(found.images);
        }
      })
      .catch(() => setListing(null));
  }, [id]);

  if (listing === null) {
    return <Navigate to="/404" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!token || !id) {
      setError('You must be logged in to edit a listing.');
      return;
    }

    if (images.length === 0) {
      setError('Please add at least one photo.');
      return;
    }

    const amenityList = amenities.split(',').map((item) => item.trim()).filter(Boolean);

    setSubmitting(true);
    try {
      await updateListing(
        id,
        {
          title,
          location,
          description,
          price: Number(price),
          maxGuests: Number(maxGuests),
          amenities: amenityList,
          images,
        },
        token,
      );
      navigate('/host/dashboard');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-4xl font-bold text-gray-900">Edit listing</h1>
        <p className="mb-8 text-gray-600">Update your listing details and photos.</p>

        {listing === undefined ? (
          <p className="text-gray-600">Loading…</p>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-700">
              Title
              <Input className="mt-2 rounded-lg" required value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Location
              <div className="mt-2">
                <LocationAutocomplete value={location} onChange={setLocation} required />
              </div>
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
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Amenities (comma separated)
              <Input className="mt-2 rounded-lg" value={amenities} onChange={(event) => setAmenities(event.target.value)} placeholder="Wifi, Free parking, Kitchen" />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Photos
              <div className="mt-2">
                <ImageListEditor images={images} onChange={setImages} />
              </div>
            </label>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full text-lg py-4">
              {submitting ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
