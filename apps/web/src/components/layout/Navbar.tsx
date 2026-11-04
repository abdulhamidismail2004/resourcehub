import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocale } from '../../contexts/LocaleContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  GraduationCap,
  Search,
  Upload,
  Bookmark,
  Sun,
  Moon,
  Globe,
  Bell,
  Menu,
  X,
  Shield,
  User as UserIcon,
  LogOut,
  Layers,
  Compass,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { locale, toggleLocale, t } = useLocale();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/discover?q=${encodeURIComponent(navSearch.trim())}`);
      setNavSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 glass">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-sky-400 flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              {t('platformName')}
            </span>
            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider -mt-1 hidden sm:inline">
              Academic Library
            </span>
          </div>
        </Link>

        {/* Global Search Bar (Desktop) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder={t('search')}
              className="w-full ps-10 pe-4 py-2 text-sm rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/70 focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </form>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
          <Link
            to="/discover"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <Compass className="w-4 h-4" />
            {t('discover')}
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <Layers className="w-4 h-4" />
                {t('dashboard')}
              </Link>
              <Link
                to="/collections"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <Bookmark className="w-4 h-4" />
                {t('collections')}
              </Link>
            </>
          )}

          {hasRole(['moderator', 'admin']) && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-primary font-semibold hover:bg-primary/10 transition-colors"
            >
              <Shield className="w-4 h-4" />
              {t('admin')}
            </Link>
          )}
        </nav>

        {/* Action Controls & User Dropdown */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-border/40"
            title="Switch Language (English / العربية)"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{locale === 'en' ? 'العربية' : 'EN'}</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Upload Button */}
          {isAuthenticated ? (
            <Link to="/upload" className="hidden sm:inline-flex">
              <Button size="sm" className="gap-1.5">
                <Upload className="w-4 h-4" />
                <span>{t('upload')}</span>
              </Button>
            </Link>
          ) : null}

          {/* Auth State */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-muted/60 transition-colors"
              >
                <div className="w-9 h-9 rounded-full ring-2 ring-primary/20 overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    user.displayName.charAt(0).toUpperCase()
                  )}
                </div>
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute end-0 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl z-50 text-sm animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-border/60 mb-1">
                      <p className="font-semibold text-foreground truncate">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <Badge variant="default" size="sm" className="mt-1.5 uppercase font-bold text-[10px]">
                        {user.role}
                      </Badge>
                    </div>

                    <Link
                      to={`/profile/${user.id}`}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      {t('profile')}
                    </Link>

                    {hasRole(['moderator', 'admin']) && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors font-medium"
                      >
                        <Shield className="w-4 h-4" />
                        {t('admin')}
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors mt-1 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  {t('signIn')}
                </Button>
              </Link>
              <Link to="/register" className="hidden sm:inline-flex">
                <Button size="sm">{t('signUp')}</Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 lg:hidden rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder={t('search')}
              className="w-full ps-10 pe-4 py-2 text-sm rounded-xl border border-border bg-muted/40"
            />
          </form>

          <div className="flex flex-col gap-1 text-sm font-medium">
            <Link
              to="/discover"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-muted flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              {t('discover')}
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-muted flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" />
                  {t('dashboard')}
                </Link>
                <Link
                  to="/collections"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-muted flex items-center gap-2"
                >
                  <Bookmark className="w-4 h-4" />
                  {t('collections')}
                </Link>
                <Link
                  to="/upload"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg hover:bg-muted flex items-center gap-2 text-primary font-bold"
                >
                  <Upload className="w-4 h-4" />
                  {t('upload')}
                </Link>
              </>
            )}

            {hasRole(['moderator', 'admin']) && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-primary font-semibold hover:bg-primary/10 flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                {t('admin')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
