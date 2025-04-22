// src/components/LoginPage.js
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage({ onLogin, onCancel }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4">
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-2">🔐 Accedeix als arxius protegits</h2>
        <p className="mb-4 text-gray-700 text-sm">
          Per obrir documents de contracte o pressupost cal iniciar sessió amb un compte de Google autoritzat.
        </p>

        <GoogleLogin
          onSuccess={credentialResponse => {
            const token = credentialResponse.credential;
            onLogin(token);
          }}
          onError={() => alert('Error signant amb Google')}
        />

        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 flex items-center justify-center text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Cancel·lar
          </button>
        )}

        <p className="mt-4 text-xs text-gray-400">
          Les dades no s’emmagatzemen i només es fan servir per validar l’accés a Google Drive.
        </p>
      </div>
    </div>
  );
}
