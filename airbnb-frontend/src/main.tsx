import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ToastProvider } from './context/ToastContext';
import 'leaflet/dist/leaflet.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<BrowserRouter>
			<ToastProvider>
				<AuthProvider>
					<FavoritesProvider>
						<AppRouter />
					</FavoritesProvider>
				</AuthProvider>
			</ToastProvider>
		</BrowserRouter>
	</React.StrictMode>
);
