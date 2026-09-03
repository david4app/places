import { Link } from 'react-router-dom';
import { Button } from '../components/UI/Button';

export function NotFound() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 text-6xl font-bold text-primary">404</div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Page not found</h1>
        <p className="mb-8 text-gray-600 text-lg">
          The stay or page you're looking for doesn't exist or has been removed.
        </p>
        
        <div className="space-y-3">
          <Link to="/" className="block">
            <Button className="w-full">Go back to stays</Button>
          </Link>
          <Link to="/profile" className="block">
            <Button variant="outline" className="w-full">View your trips</Button>
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-600">
          <p className="mb-2">Need help?</p>
          <a href="#" className="text-primary hover:underline font-medium">Contact our support team</a>
        </div>
      </div>
    </main>
  );
}
