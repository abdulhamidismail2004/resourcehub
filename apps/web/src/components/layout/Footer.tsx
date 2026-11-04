import React from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../../contexts/LocaleContext';
import { GraduationCap, Heart, Github, BookOpen, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useLocale();

  return (
    <footer className="w-full border-t border-border bg-card/60 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span>{t('platformName')}</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('tagline')}. A unified open repository empowering universities, scholars, and students with high-yield peer-reviewed learning assets.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Discovery</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <Link to="/discover" className="hover:text-primary transition-colors">All Resources</Link>
              </li>
              <li>
                <Link to="/discover?categoryId=a0000000-0000-0000-0000-000000000001" className="hover:text-primary transition-colors">Computer Science</Link>
              </li>
              <li>
                <Link to="/discover?categoryId=a0000000-0000-0000-0000-000000000002" className="hover:text-primary transition-colors">Mathematics</Link>
              </li>
              <li>
                <Link to="/discover?categoryId=a0000000-0000-0000-0000-000000000004" className="hover:text-primary transition-colors">Medicine</Link>
              </li>
            </ul>
          </div>

          {/* Academic Community */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Scholars & Community</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <Link to="/upload" className="hover:text-primary transition-colors">Upload & Share</Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-primary transition-colors">Curated Collections</Link>
              </li>
              <li>
                <span className="text-muted-foreground/60">Institutional Guidelines</span>
              </li>
              <li>
                <span className="text-muted-foreground/60">Peer Review Standards</span>
              </li>
            </ul>
          </div>

          {/* Platform Status */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">System Health</h4>
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Services Operational</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              PostgreSQL Relational Storage • Fastify REST API • S3 Storage Engine • Bilingual RTL/LTR
            </p>
          </div>
        </div>

        <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} ResourceHub Platform. Built for excellence in education.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for Academic Research
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
