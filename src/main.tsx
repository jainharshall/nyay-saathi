import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import './index.css';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
