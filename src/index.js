// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import DetailView from './components/DetailView';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/detail/:id/:tab" element={<DetailView />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);