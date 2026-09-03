import { useEffect, useRef, useState } from 'react';
import { Input } from './Input';
import { searchLocations } from '../../api/client';
import type { LocationSuggestion } from '../../types';

type LocationAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

export function LocationAutocomplete({ value, onChange, placeholder, required }: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(() => {
      searchLocations(query)
        .then((results) => {
          if (!cancelled) setSuggestions(results);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    onChange(suggestion.label);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        className="rounded-lg"
        required={required}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && (loading || suggestions.length > 0) && (
        <ul className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {loading && suggestions.length === 0 && (
            <li className="px-4 py-3 text-sm text-gray-500">Searching…</li>
          )}
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.label}-${suggestion.lat}-${suggestion.lng}`}>
              <button
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className="block w-full truncate px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
