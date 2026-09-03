import { Link } from 'react-router-dom';
import { FaUser, FaRegHeart } from 'react-icons/fa';
import { Button } from '../UI/Button';
import { useAuth } from '../../context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="text-2xl font-bold text-primary">✦</div>
          <span className="text-xl font-bold text-gray-900">staybnb</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link to="/host" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
            Become a host
          </Link>
          {user && (
            <Link to="/host/dashboard" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              My listings
            </Link>
          )}
          {user && (
            <Link to="/favorites" className="text-gray-700 hover:text-primary transition-colors" aria-label="Favorites">
              <FaRegHeart className="h-5 w-5" />
            </Link>
          )}
          {user ? <div className="flex items-center gap-3"><Link to="/profile" className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 hover:border-primary hover:shadow-md transition-all"><FaUser className="text-gray-600" /><span className="hidden text-sm font-medium text-gray-700 sm:inline">{user.name}</span></Link><Button variant="ghost" className="px-3 py-2 text-sm" onClick={() => void logout()}>Log out</Button></div> : <div className="flex items-center gap-2"><Link className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary" to="/login">Log in</Link><Link to="/register"><Button className="px-4 py-2 text-sm">Register</Button></Link></div>}
        </nav>
      </div>
    </header>
  );
}
