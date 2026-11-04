import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ResourceCard } from '../components/resources/ResourceCard';
import {
  Upload,
  Bookmark,
  Layers,
  TrendingUp,
  FileText,
  Clock,
  ArrowRight,
  School,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLocale();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'uploads' | 'saved' | 'recommended'>('uploads');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.get<{ success: boolean; data: any }>('/api/users/dashboard');
        if (res.success) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl space-y-8">
        <div className="h-32 rounded-3xl bg-muted/40 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || { uploaded: 0, bookmarks: 0, collections: 0 };
  const myResources = dashboardData?.myResources || [];
  const savedResources = dashboardData?.savedResources || [];
  const popularResources = dashboardData?.popularResources || [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl border border-border/80 bg-gradient-to-r from-primary/10 via-card to-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {user?.displayName}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
            <School className="w-4 h-4" />
            <span>{user?.institution || 'Academic Scholar'}</span>
          </p>
        </div>

        <Link to="/upload">
          <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 shrink-0">
            <Upload className="w-4 h-4" />
            <span>{t('uploadNow')}</span>
          </Button>
        </Link>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{stats.uploaded}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Published Resources
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{stats.bookmarks}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Saved Bookmarks
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{stats.collections}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Study Collections
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'uploads'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            My Uploads ({myResources.length})
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'saved'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Saved Bookmarks ({savedResources.length})
          </button>

          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'recommended'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Recommended For You
          </button>
        </div>

        {/* Tab 1: Uploads */}
        {activeTab === 'uploads' && (
          <div>
            {myResources.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
                <FileText className="w-10 h-10 text-muted-foreground/60 mx-auto" />
                <h3 className="font-bold text-base">You haven't uploaded any resources yet.</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Share your lecture notes, summaries, or problem sets with students and colleagues.
                </p>
                <Link to="/upload">
                  <Button size="sm" className="mt-2">Upload First Resource</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myResources.map((res: any) => (
                  <Link
                    key={res.id}
                    to={`/resources/${res.id}`}
                    className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <Badge variant="secondary" size="sm">{res.categoryName}</Badge>
                        <Badge
                          variant={res.status === 'approved' ? 'success' : res.status === 'pending' ? 'warning' : 'destructive'}
                          size="sm"
                          className="capitalize font-bold text-[10px]"
                        >
                          {res.status}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-2">{res.title}</h4>
                    </div>

                    <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(res.createdAt).toLocaleDateString()}</span>
                      <span className="font-semibold text-foreground">{res.downloadCount} Downloads</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Saved */}
        {activeTab === 'saved' && (
          <div>
            {savedResources.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
                <Bookmark className="w-10 h-10 text-muted-foreground/60 mx-auto" />
                <h3 className="font-bold text-base">No saved bookmarks yet.</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click the bookmark icon on any paper or presentation to save it for quick reference.
                </p>
                <Link to="/discover">
                  <Button size="sm" variant="outline" className="mt-2">Explore Resources</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedResources.map((res: any) => (
                  <Link
                    key={res.id}
                    to={`/resources/${res.id}`}
                    className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <Badge variant="secondary" size="sm">{res.categoryName}</Badge>
                      <h4 className="font-bold text-sm text-foreground line-clamp-2">{res.title}</h4>
                    </div>
                    <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{res.subject}</span>
                      <span className="font-semibold text-primary">{res.downloadCount} Downloads</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Recommended */}
        {activeTab === 'recommended' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularResources.map((res: any) => (
              <ResourceCard key={res.id} resource={res} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
