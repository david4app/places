import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import App from '../App';
import { Home } from '../pages/Home';
import { ListingDetail } from '../pages/ListingDetail';
import { Booking } from '../pages/Booking';
import { Profile } from '../pages/Profile';
import { Host } from '../pages/Host';
import { HostDashboard } from '../pages/HostDashboard';
import { Favorites } from '../pages/Favorites';
import { NotFound } from '../pages/NotFound';
import { Auth } from '../pages/Auth';
import { Messages } from '../pages/Messages';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }: { children: JSX.Element }) {
	const { user } = useAuth();
	const location = useLocation();
	return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export default function AppRouter() {
	return (
		<Routes>
			<Route element={<App />}>
				<Route path="/" element={<Home />} />
				<Route path="/login" element={<Auth mode="login" />} />
				<Route path="/register" element={<Auth mode="register" />} />
				<Route path="/listing/:id" element={<ListingDetail />} />
				<Route path="/booking/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
				<Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
				<Route path="/messages/:bookingId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
				<Route path="/host" element={<ProtectedRoute><Host /></ProtectedRoute>} />
				<Route path="/host/dashboard" element={<ProtectedRoute><HostDashboard /></ProtectedRoute>} />
				<Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
				<Route path="/404" element={<NotFound />} />
				<Route path="*" element={<NotFound />} />
			</Route>
		</Routes>
	);
}
