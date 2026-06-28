'use client';

import { useState } from 'react';

interface WelcomeScreenProps {
  onSignUp: () => void;
  onLogin: () => void;
}

export default function WelcomeScreen({ onSignUp, onLogin }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="text-5xl mb-4">🛒</div>
          <h1 className="text-4xl font-bold text-white">Shopping List</h1>
          <p className="text-slate-300">Keep your shopping organized and simple</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onSignUp}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Create Account
          </button>
          <button
            onClick={onLogin}
            className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          Demo: Use any email and any 4-digit PIN
        </p>
      </div>
    </div>
  );
}
