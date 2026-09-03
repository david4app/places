import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import type { Listing } from '../../types';

const markerIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type PlottableListing = Listing & { lat: number; lng: number };

function FitBounds({ listings }: { listings: PlottableListing[] }) {
  const map = useMap();

  useEffect(() => {
    if (listings.length === 0) return;
    if (listings.length === 1) {
      map.setView([listings[0].lat, listings[0].lng], 11);
      return;
    }
    const bounds = L.latLngBounds(listings.map((listing) => [listing.lat, listing.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [listings, map]);

  return null;
}

export function ListingsMap({ listings }: { listings: Listing[] }) {
  const points = useMemo(
    () => listings.filter((listing): listing is PlottableListing => listing.lat !== null && listing.lng !== null),
    [listings],
  );

  return (
    <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds listings={points} />
      {points.map((listing) => (
        <Marker key={listing.id} position={[listing.lat, listing.lng]} icon={markerIcon}>
          <Popup>
            <Link to={`/listing/${listing.id}`} className="font-semibold text-gray-900 hover:underline">
              {listing.title}
            </Link>
            <p className="text-sm text-gray-600">{listing.location}</p>
            <p className="text-sm font-semibold text-gray-900">${listing.price} / night</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
