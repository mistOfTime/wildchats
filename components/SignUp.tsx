'use client';

import { useState } from 'react';
import { authService } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface SignUpProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function SignUp({ onSuccess, onSwitchToLogin }: SignUpProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await authService.signUp({ fullName, email, password });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
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
            Account Created!
          </h2>
          <p className="text-amber-200">
            Check your email to verify your account
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-600 px-4 relative overflow-hidden">
      {/* Floating logos background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" alt="" className="absolute w-24 h-24 rounded-full opacity-10 animate-float" style={{ top: '10%', left: '10%', animationDelay: '0s' }} />
        <img src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" alt="" className="absolute w-32 h-32 rounded-full opacity-10 animate-float" style={{ top: '20%', right: '15%', animationDelay: '2s' }} />
        <img src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" alt="" className="absolute w-20 h-20 rounded-full opacity-10 animate-float" style={{ bottom: '15%', left: '20%', animationDelay: '4s' }} />
        <img src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" alt="" className="absolute w-28 h-28 rounded-full opacity-10 animate-float" style={{ bottom: '25%', right: '10%', animationDelay: '1s' }} />
        <img src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" alt="" className="absolute w-24 h-24 rounded-full opacity-10 animate-float" style={{ top: '50%', left: '5%', animationDelay: '3s' }} />
        <img src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" alt="" className="absolute w-20 h-20 rounded-full opacity-10 animate-float" style={{ top: '60%', right: '8%', animationDelay: '5s' }} />
        <img src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" alt="" className="absolute w-16 h-16 rounded-full opacity-10 animate-float" style={{ top: '35%', left: '25%', animationDelay: '1.5s' }} />
        <img src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" alt="" className="absolute w-28 h-28 rounded-full opacity-10 animate-float" style={{ top: '70%', left: '15%', animationDelay: '3.5s' }} />
        <img src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" alt="" className="absolute w-24 h-24 rounded-full opacity-10 animate-float" style={{ top: '15%', right: '30%', animationDelay: '2.5s' }} />
        <img src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" alt="" className="absolute w-20 h-20 rounded-full opacity-10 animate-float" style={{ bottom: '10%', right: '25%', animationDelay: '4.5s' }} />
        <img src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" alt="" className="absolute w-32 h-32 rounded-full opacity-10 animate-float" style={{ top: '45%', right: '20%', animationDelay: '0.5s' }} />
        <img src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" alt="" className="absolute w-16 h-16 rounded-full opacity-10 animate-float" style={{ bottom: '40%', left: '12%', animationDelay: '5.5s' }} />
      </div>

      <div className="bg-gradient-to-br from-red-900/80 via-amber-900/80 to-red-950/80 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-sm md:max-w-md border-2 border-amber-700/50 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-amber-800 rounded-full mb-4 shadow-lg ring-4 ring-yellow-600">
            <img 
              src="https://tse3.mm.bing.net/th/id/OIP.7aJ7MqW3gaesL5SJALtnkgHaHO?rs=1&pid=ImgDetMain" 
              alt="CIT Logo" 
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
          <h1 className="text-4xl font-bold mb-2 tracking-wide">
            <span className="text-orange-500 font-extrabold">Wild</span>
            <span className="text-yellow-500 font-extrabold italic">Chats</span>
          </h1>
          <p className="text-amber-200 mt-2">
            Join and start chatting
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-amber-200 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Enter your full name"
              className="w-full px-4 py-3 bg-white border-2 border-amber-800 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 placeholder-gray-400 transition"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-amber-200 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password"
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
              placeholder="Confirm your password"
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-amber-200">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-yellow-400 font-semibold hover:text-yellow-300 hover:underline transition"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
