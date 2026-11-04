import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocale } from '../contexts/LocaleContext';
import { api } from '../lib/api';
import { Resource, Category } from '@resourcehub/shared';
import { ResourceCard } from '../components/resources/ResourceCard';
import { Button } from '../components/ui/Button';
import {
  Search,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Users,
  FileCheck,
  Cpu,
  Calculator,
  Atom,
  HeartPulse,
  Wrench,
  TrendingUp as BusinessIcon,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredResources, setFeaturedResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [catRes, resRes] = await Promise.all([
          api.get<{ success: boolean; data: Category[] }>('/api/categories'),
          api.get<{ success: boolean; data: { items: Resource[] } }>('/api/resources?pageSize=6&sortBy=downloads'),
        ]);

        if (catRes.success) setCategories(catRes.data);
        if (resRes.success) setFeaturedResources(resRes.data.items);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'computer-science':
        return <Cpu className="w-5 h-5 text-sky-500" />;
      case 'mathematics':
        return <Calculator className="w-5 h-5 text-indigo-500" />;
      case 'physics':
        return <Atom className="w-5 h-5 text-purple-500" />;
      case 'medicine':
        return <HeartPulse className="w-5 h-5 text-rose-500" />;
      case 'engineering':
        return <Wrench className="w-5 h-5 text-amber-500" />;
      default:
        return <BusinessIcon className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 border-b border-border/50 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider animate-in fade-in slide-in-from-top-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Academic Knowledge Repository</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              {t('heroTitle')}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {t('heroSubtitle')}
            </p>

            {/* Hero Search Box */}
            <form onSubmit={handleHeroSearch} className="pt-4 max-w-xl mx-auto">
              <div className="relative flex items-center shadow-xl shadow-primary/5 rounded-2xl overflow-hidden border-2 border-border focus-within:border-primary transition-all">
                <Search className="absolute start-4 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search')}
                  className="w-full ps-12 pe-28 py-3.5 text-base bg-card text-foreground outline-none"
                />
                <Button type="submit" size="md" className="absolute end-2 rounded-xl">
                  {t('discover')}
                </Button>
              </div>
            </form>

            {/* Popular Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/80">{t('popularTags')}</span>
              {['Algorithms', 'Calculus', 'Machine Learning', 'Quantum Physics', 'Python'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/discover?tag=${tag.toLowerCase().replace(' ', '-')}`)}
                  className="px-2.5 py-1 rounded-lg bg-muted/70 hover:bg-muted text-foreground transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Platform Value Metrics */}
      <section className="py-12 border-b border-border/40 bg-card/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-foreground tracking-tight">100%</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Peer-Reviewed Quality</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-foreground tracking-tight">50+ MB</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">High-Yield File Streaming</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-foreground tracking-tight">Bilingual</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">English & Arabic RTL</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-foreground tracking-tight">Instant</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">In-Browser PDF Previews</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Browse Disciplines / Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Explore Academic Disciplines</h2>
              <p className="text-sm text-muted-foreground mt-1">Browse verified lecture materials by core field of study.</p>
            </div>
            <Link to="/discover">
              <Button variant="outline" size="sm" className="gap-1.5">
                <span>View All Fields</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/discover?categoryId=${cat.id}`}
                className="group flex items-start gap-4 p-5 rounded-2xl border border-border/70 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {getCategoryIcon(cat.slug)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                  {cat.resourceCount !== undefined && (
                    <span className="inline-block text-[11px] font-semibold text-primary pt-1">
                      {cat.resourceCount} {cat.resourceCount === 1 ? 'Resource' : 'Resources'}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Trending & Featured Resources Grid */}
      <section className="py-16 bg-muted/20 border-t border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Most Downloaded This Month</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Featured Academic Materials</h2>
            </div>
            <Link to="/discover?sortBy=downloads">
              <Button variant="outline" size="sm" className="gap-1.5">
                <span>Browse Full Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredResources.map((res) => (
                <ResourceCard key={res.id} resource={res} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
