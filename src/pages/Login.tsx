
import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthForm from '../components/auth/AuthForm';
import { useAuth } from '../context/AuthContext';
import { LockKeyhole } from 'lucide-react';

const Login: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if user is already authenticated
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/30">
      <div className="w-full max-w-md text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <LockKeyhole className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">OffTheRadar</h1>
        <p className="mt-2 text-muted-foreground">Secure messaging for the privacy-conscious</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <AuthForm />
      )}

      <div className="mt-12 text-center text-sm text-muted-foreground animate-fade-in">
        <p>All messages are encrypted end-to-end.</p>
        <p>We cannot read your messages, and neither can anyone else.</p>
      </div>
    </div>
  );
};

export default Login;
