import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GraduationCap, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Sign In to {t('platformName')}
          </h1>
          <p className="text-xs text-muted-foreground">
            Access academic papers, personalized collections, and research notes.
          </p>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Demo Review Roles</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin@resourcehub.edu', 'AdminPassword123!')}
              className="px-2 py-1.5 rounded-lg border border-border bg-card hover:border-primary text-xs font-semibold text-foreground transition-all"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemo('moderator@resourcehub.edu', 'Password123!')}
              className="px-2 py-1.5 rounded-lg border border-border bg-card hover:border-primary text-xs font-semibold text-foreground transition-all"
            >
              Moderator
            </button>
            <button
              type="button"
              onClick={() => fillDemo('student@resourcehub.edu', 'Password123!')}
              className="px-2 py-1.5 rounded-lg border border-border bg-card hover:border-primary text-xs font-semibold text-foreground transition-all"
            >
              Student
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="scholar@university.edu"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button type="submit" size="lg" isLoading={isLoading} className="w-full mt-2">
            {t('signIn')}
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-4 border-t border-border/50">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
