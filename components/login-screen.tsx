'use client';

import { useState, useRef } from 'react';
import { loginWithPin, login } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

interface LoginScreenProps {
  onSuccess: () => void;
  onBack: () => void;
}

export default function LoginScreen({ onSuccess, onBack }: LoginScreenProps) {
  const { setManualUser } = useAuth();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
  };

  const switchMode = () => {
    setUsePassword(!usePassword);
    setError('');
    setPin(['', '', '', '']);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (usePassword) {
        await login(email, password);
        onSuccess();
      } else {
        const enteredPin = pin.join('');
        if (enteredPin.length < 4) {
          setError('Please enter your 4-digit PIN');
          setLoading(false);
          return;
        }
        const user = await loginWithPin(email, enteredPin);
        setManualUser(user);
        onSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      if (message === 'EMAIL_NOT_VERIFIED') {
        setError(
          'Your email is not verified. Use Password Login below to reach the verification screen.'
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-sm w-full space-y-6">
        <h1 className="text-3xl font-bold text-white text-center">Welcome Back 👋</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* PIN boxes or Password field */}
          {!usePassword ? (
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-3">PIN</label>
              <div className="flex gap-3 justify-center">
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={pinRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    className="w-14 h-14 text-center text-2xl font-bold bg-slate-700 border-2 border-slate-500 rounded-xl text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="text-center space-y-3">
          <button
            onClick={switchMode}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {usePassword ? 'Use PIN instead' : 'Forgot PIN? Use Password instead'}
          </button>

          <div>
            <button
              onClick={onBack}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Don&apos;t have an account? Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
