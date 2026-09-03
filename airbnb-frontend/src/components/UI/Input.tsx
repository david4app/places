import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-full border border-gray-300 px-4 py-3 text-gray-800 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-md transition-all placeholder-gray-400 ${className}`}
      {...props}
    />
  );
}
