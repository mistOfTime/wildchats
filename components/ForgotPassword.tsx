'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ForgotPasswordProps {
  onBack: () => void;
}

const LOGO = 'https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain';

const FloatingLogos = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[
      { size: 'w-12 h-12 md:w-16 md:h-16', style: { top: '10%', left: '10%', animationDelay: '0s' } },
      { size: 'w-16 h-16 md:w-20 md:h-20', style: { top: '20%', right: '15%', animationDelay: '1s' } },
      { size: 'w-10 h-10 md:w-14 md:h-14', style: { bottom: '15%', left: '20%', animationDelay: '2s' } },
      { size: 'w-14 h-14', style: { bottom: '25%', right: '10%', animationDelay: '0.5s' } },
      { size: 'w-12 h-12 md:w-16 md:h-16', style: { top: '50%', left: '5%', animationDelay: '1.5s' } },
      { size: 'w-10 h-10 md:w-14 md:h-14', style: { top: '60%', right: '8%', animationDelay: '2.5s' } },
      { size: 'w-8 h-8 md:w-12 md:h-12', style: { top: '35%', left: '25%', animationDelay: '0.8s' } },
      { size: 'w-14 h-14', style: { top: '70%', left: '15%', animationDelay: '1.8s' } },
    ].map((item, i) => (
      <img key={i} src={LOGO} alt="" className={`absolute ${item.size} rounded-full opacity-10 animate-float`} style={item.style} />
    ))}
  </div>
);

export default function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-600 px-4 relative overflow-hidden">
      <FloatingLogos />

      <div className="bg-gradient-to-br from-red-900/80 via-amber-900/80 to-red-950/80 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-sm md:max-w-md border-2 border-amber-700/50 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-amber-800 rounded-full mb-4 shadow-lg ring-4 ring-yellow-600">
            <img src={LOGO} alt="CIT Logo" className="w-20 h-20 rounded-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white">Reset Password</h1>
          <p className="text-amber-200 mt-2">
            {sent ? 'Check your email for the reset link' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="inline-block p-3 bg-green-900/30 rounded-full ring-4 ring-green-700">
              <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-amber-200 text-sm">
              We sent a password reset link to <span className="text-white font-semibold">{email}</span>. Click the link in the email to set a new password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-amber-200 mb-2">Email</label>
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
              className="w-full bg-gradient-to-r from-red-800 to-yellow-600 text-white py-3 rounded-xl font-semibold hover:from-red-900 hover:to-yellow-700 transition disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button onClick={onBack} className="text-sm text-amber-200 hover:text-white transition">
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
