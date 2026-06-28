'use client';

import { useState } from 'react';
import { checkAndMarkEmailVerified, resendVerificationEmail } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

interface EmailVerificationScreenProps {
  email: string;
  uid: string;
}

export default function EmailVerificationScreen({ email, uid }: EmailVerificationScreenProps) {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSent, setResendSent] = useState(false);

  const handleVerified = async () => {
    setLoading(true);
    setError('');
    try {
      const verified = await checkAndMarkEmailVerified(uid);
      if (verified) {
        await refreshUser();
        // refreshUser updates auth context → user.emailVerified becomes true → main app shows
      } else {
        setError('Email not verified yet. Please check your inbox.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await resendVerificationEmail();
      setResendSent(true);
      setTimeout(() => setResendSent(false), 4000);
    } catch {
      setError('Failed to resend. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-6">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div className="text-6xl">📧</div>
        <h1 className="text-2xl font-bold text-white">Verify Your Email</h1>
        <p className="text-slate-300 leading-relaxed">
          We sent a verification link to{' '}
          <span className="text-blue-400 font-medium break-all">{email}</span>.
          <br />
          <br />
          Please check your inbox and click the link, then come back.
        </p>

        {error && (
          <div className="p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleVerified}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Checking...' : "I've Verified — Continue"}
        </button>

        <button
          onClick={handleResend}
          className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
        >
          {resendSent ? '✓ Verification email resent!' : 'Resend email'}
        </button>
      </div>
    </div>
  );
}
