/**
 * main.jsx — Application entry point.
 *
 * Keep this as slim as possible. All providers (QueryClient, Theme, Auth)
 * live inside App.jsx so that they are accessible during hot module
 * replacement and testing without needing wrapper setup here.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';          // Tailwind directives + global CSS vars
import './styles/main.scss';   // SCSS theme tokens (loaded for chart theming)

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
