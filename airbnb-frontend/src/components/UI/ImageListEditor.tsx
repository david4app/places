import { useRef, useState } from 'react';
import { FaArrowDown, FaArrowUp, FaTimes, FaUpload } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { uploadImage } from '../../api/client';

type ImageListEditorProps = {
  images: string[];
  onChange: (images: string[]) => void;
};

export function ImageListEditor({ images, onChange }: ImageListEditorProps) {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !token) return;
    setError('');
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(fileList)) {
        uploaded.push(await uploadImage(file, token));
      }
      onChange([...images, ...uploaded]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload photo.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      {images.length > 0 && (
        <ul className="mb-3 space-y-2">
          {images.map((url, index) => (
            <li key={`${url}-${index}`} className="flex items-center gap-3 rounded-lg border border-gray-200 p-2">
              <img src={url} alt={`Photo ${index + 1}`} className="h-14 w-20 shrink-0 rounded-md object-cover" />
              <span className="flex-1 truncate text-sm text-gray-600">Photo {index + 1}</span>
              {index === 0 && (
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Cover</span>
              )}
              <button
                type="button"
                onClick={() => moveImage(index, -1)}
                disabled={index === 0}
                className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                aria-label="Move up"
              >
                <FaArrowUp />
              </button>
              <button
                type="button"
                onClick={() => moveImage(index, 1)}
                disabled={index === images.length - 1}
                className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                aria-label="Move down"
              >
                <FaArrowDown />
              </button>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-50"
                aria-label="Remove image"
              >
                <FaTimes />
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        capture="environment"
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary disabled:opacity-50"
      >
        <FaUpload />
        {uploading ? 'Uploading…' : 'Upload photos from your device'}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-gray-500">The first photo is used as the cover image. Use the arrows to reorder.</p>
    </div>
  );
}
