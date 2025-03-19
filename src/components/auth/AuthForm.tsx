
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'signup';

const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, signup } = useAuth();

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    // Reset form when toggling
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Name is required');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await signup(name, email, password);
      }
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <div className="glass-card rounded-2xl p-8 backdrop-blur-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'login' 
              ? 'Sign in to access your secure messages' 
              : 'Sign up to start secure messaging'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input transition-all duration-200"
                  placeholder="Your name"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                <Mail size={18} />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input transition-all duration-200"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                <Lock size={18} />
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input transition-all duration-200"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input transition-all duration-200"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-all duration-200 flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
            ) : (
              mode === 'login' ? 'Sign in' : 'Create account'
            )}
          </button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-primary hover:underline focus:outline-none"
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
