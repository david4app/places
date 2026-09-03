import { useState, type MouseEvent } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

type ImageCarouselProps = { images: string[]; alt: string; className?: string };

export function ImageCarousel({ images, alt, className = '' }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);

  const go = (event: MouseEvent, direction: 1 | -1) => {
    event.preventDefault();
    event.stopPropagation();
    setIndex((current) => (current + direction + images.length) % images.length);
  };

  return (
    <div className={`group relative overflow-hidden bg-gray-200 ${className}`}>
      <img className="h-full w-full object-cover" src={images[index]} alt={alt} loading="lazy" />
      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(event) => go(event, -1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow-md transition group-hover:opacity-100 hover:bg-white active:scale-95"
          >
            <FaChevronLeft className="text-gray-800" size={14} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(event) => go(event, 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 opacity-0 shadow-md transition group-hover:opacity-100 hover:bg-white active:scale-95"
          >
            <FaChevronRight className="text-gray-800" size={14} />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((image, dotIndex) => (
              <button
                key={image}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex(dotIndex);
                }}
                className={`h-2 transition-all ${
                  dotIndex === index ? 'bg-white w-2 rounded-full' : 'bg-white/60 w-1.5 rounded-full'
                }`}
                aria-label={`Go to image ${dotIndex + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
