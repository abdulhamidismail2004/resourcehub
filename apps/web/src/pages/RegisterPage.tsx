import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { GraduationCap, Lock, Mail, User, School, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        displayName,
        email,
        password,
        institution: institution || undefined,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Join {t('platformName')}
          </h1>
          <p className="text-xs text-muted-foreground">
            Connect with educators and students to discover and share high-yield educational assets.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <Input
            label="Full Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Dr. Katherine Johnson"
            leftIcon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Academic Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="scholar@university.edu"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="University or Institution"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g., MIT, Stanford, Cairo University"
            leftIcon={<School className="w-4 h-4" />}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters with 1 number"
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button type="submit" size="lg" isLoading={isLoading} className="w-full mt-2">
            Create Account
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-4 border-t border-border/50">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary hover:underline">
              {t('signIn')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
