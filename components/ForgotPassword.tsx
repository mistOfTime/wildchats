'use client';

import { useState } from 'react';
import { authService } from '@/lib/auth';

interface ForgotPasswordProps {
  onBack: () => void;
}

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.sendPasswordResetCode(email);
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.verifyResetCode(email, code);
      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Call API to reset password
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-600 px-4">
        <div className="bg-gradient-to-br from-red-900/80 via-amber-900/80 to-red-950/80 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-sm md:max-w-md border-2 border-amber-700/50 text-center">
          <div className="inline-block p-3 bg-green-900/30 rounded-full mb-4 ring-4 ring-green-700">
            <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Password Reset!
          </h2>
          <p className="text-amber-200">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-600 px-4">
      <div className="bg-gradient-to-br from-red-900/80 via-amber-900/80 to-red-950/80 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-sm md:max-w-md border-2 border-amber-700/50">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-amber-800 rounded-full mb-4 shadow-lg ring-4 ring-yellow-600">
            <img 
              src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" 
              alt="CIT Logo" 
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-white">
            {step === 'email' && 'Reset Password'}
            {step === 'code' && 'Enter Code'}
            {step === 'password' && 'New Password'}
          </h1>
          <p className="text-amber-200 mt-2">
            {step === 'email' && 'Enter your email to receive a code'}
            {step === 'code' && 'Enter the 6-digit code sent to your email'}
            {step === 'password' && 'Create your new password'}
          </p>
        </div>
        
        {step === 'email' && (
          <form onSubmit={handleSendCode} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-amber-200 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-white border-2 border-amber-800 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400 transition"
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-800 to-yellow-600 text-white py-3 rounded-xl font-semibold hover:from-red-900 hover:to-yellow-700 transition disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-amber-200 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full px-4 py-3 bg-white border-2 border-amber-800 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400/60 transition text-center text-2xl tracking-widest"
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-gradient-to-r from-red-800 to-yellow-600 text-white py-3 rounded-xl font-semibold hover:from-red-900 hover:to-yellow-700 transition disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-sm text-amber-200 hover:text-white transition"
            >
              ← Resend code
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-amber-200 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
                className="w-full px-4 py-3 bg-white border-2 border-amber-800 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-200 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                className="w-full px-4 py-3 bg-white border-2 border-amber-800 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400 transition"
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-800 to-yellow-600 text-white py-3 rounded-xl font-semibold hover:from-red-900 hover:to-yellow-700 transition disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="text-sm text-amber-200 hover:text-white transition"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
