import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'outline' };

const variantClasses = {
  primary: 'bg-primary text-white hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md',
  ghost: 'text-gray-700 hover:bg-gray-100 disabled:opacity-50',
  outline: 'border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold transition-all ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
