'use client';

import { useState } from 'react';
import { useLoginMutation, useRegisterMutation } from '@/store/api/authApi';
import type { User } from '@/store/slices/authSlice';

function decodeJwt(token: string): { sub?: string; role?: string; email?: string } {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

export default function ArticleArenaAuth({
  onLoginSuccess,
}: {
  onLoginSuccess: (user: User, token: string) => void;
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading: loginLoading, error: loginError }] = useLoginMutation();
  const [register, { isLoading: registerLoading, error: registerError }] = useRegisterMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      const res = await login(params).unwrap();
      const payload = decodeJwt(res.access_token);
      const user: User = {
        id: parseInt(payload.sub || '0'),
        email: payload.email || email,
        role: (payload.role === 'admin' ? 'admin' : 'competitor') as 'admin' | 'competitor',
        is_active: true,
      };
      onLoginSuccess(user, res.access_token);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData = await register({ email, password }).unwrap();
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      const res = await login(params).unwrap();
      const payload = decodeJwt(res.access_token);
      const user: User = {
        id: userData.id,
        email: userData.email,
        role: (payload.role === 'admin' ? 'admin' : 'competitor') as 'admin' | 'competitor',
        is_active: true,
      };
      onLoginSuccess(user, res.access_token);
    } catch (err) {
      console.error(err);
    }
  };

  const loading = loginLoading || registerLoading;
  const error = loginError || registerError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060608] px-4">
      <div className="hero-bg-grid" style={{ position: 'absolute', inset: 0 }} />
      <div className="hero-orb hero-orb-1" style={{ position: 'absolute' }} />
      <div className="hero-orb hero-orb-2" style={{ position: 'absolute' }} />

      <div
        className="relative z-10 w-full max-w-md p-10 rounded-none border border-[#1e1e2e]"
        style={{
          background: '#0d0d12',
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
        }}
      >
        <div className="mb-8">
          <div
            className="text-[#e8ff47] text-xs tracking-[0.3em] uppercase mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ArticleArena
          </div>
          <h1
            className="text-4xl font-normal tracking-tight text-[#e8e8f0]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </h1>
          <p className="text-sm text-[#5a5a7a] mt-2">
            {isLogin ? 'Access your dashboard' : 'Join the competition'}
          </p>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-6">
          {error && (
            <div
              className="px-4 py-3 text-sm border rounded"
              style={{
                background: 'rgba(255,71,87,0.1)',
                borderColor: '#ff4757',
                color: '#ff4757',
              }}
            >
              {(error as { data?: { detail?: string } })?.data?.detail || 'Invalid credentials'}
            </div>
          )}

          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[#5a5a7a] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-4 bg-[#0d0d12] border border-[#1e1e2e] text-[#e8e8f0] outline-none transition-all focus:border-[#e8ff47] focus:shadow-[0_0_0_1px_rgba(232,255,71,0.2)]"
              placeholder="you@example.com"
              style={{ fontFamily: "'Syne', sans-serif" }}
            />
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[#5a5a7a] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-4 bg-[#0d0d12] border border-[#1e1e2e] text-[#e8e8f0] outline-none transition-all focus:border-[#e8ff47] focus:shadow-[0_0_0_1px_rgba(232,255,71,0.2)]"
              placeholder="••••••••"
              style={{ fontFamily: "'Syne', sans-serif" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#e8ff47] text-black font-bold text-sm tracking-[0.1em] uppercase transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(232,255,71,0.3)] disabled:opacity-50"
            style={{
              fontFamily: "'Syne', sans-serif",
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
            }}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-sm text-[#5a5a7a] text-center">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setEmail('');
              setPassword('');
            }}
            className="text-[#e8ff47] font-medium hover:underline"
          >
            {isLogin ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
