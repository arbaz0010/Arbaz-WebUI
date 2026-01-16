import React, { useState } from 'react';
import { User, Shield } from './Icon';

interface AuthProps {
  onLogin: (token: string, username: string, role: 'admin' | 'user') => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onLogin('mock-jwt-token', email.split('@')[0] || 'user', role);
    }, 800);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="flex flex-col items-center mb-8">
          <div className="icon-box blue mb-4 rounded-full" style={{ width: '4rem', height: '4rem', color: 'var(--primary)', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Enter your credentials to access the local inference cluster.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black/20"
                style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                placeholder="admin@local.host"
              />
              <User className="absolute left-3 top-2.5 text-gray-400" size={18} style={{ top: '0.625rem', left: '0.75rem' }} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-black/20"
              style={{ width: '100%', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
              placeholder="••••••••"
            />
          </div>

          {/* Role Selection */}
          <div className="flex items-center gap-4 py-2">
             <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="role" 
                  checked={role === 'user'} 
                  onChange={() => setRole('user')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span className="text-sm">User</span>
             </label>
             <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="role" 
                  checked={role === 'admin'} 
                  onChange={() => setRole('admin')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span className="text-sm">Admin</span>
             </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" style={{ width: '1.25rem', height: '1.25rem', borderRadius: '9999px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 1s linear infinite' }}></span>
            ) : (
              isLogin ? 'Sign In' : 'Register'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium hover-underline"
            style={{ color: 'var(--primary)' }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
        
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Auth;