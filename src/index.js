import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="AQUÍ_VA_EL_TEU_CLIENT_ID">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
