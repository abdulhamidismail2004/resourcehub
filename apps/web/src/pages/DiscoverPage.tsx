import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocale } from '../contexts/LocaleContext';
import { api } from '../lib/api';
import { Resource, Category } from '@resourcehub/shared';
import { ResourceCard } from '../components/resources/ResourceCard';
import { Button } from '../components/ui/Button';
import {
  Search,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Presentation,
  FileSpreadsheet,
  Image as ImageIcon,
} from 'lucide-react';

export const DiscoverPage: React.FC = () => {
  const { t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Search parameters from URL
  const q = searchParams.get('q') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const tag = searchParams.get('tag') || '';
  const academicLevel = searchParams.get('academicLevel') || '';
  const fileExtension = searchParams.get('fileExtension') || '';
  const sortBy = searchParams.get('sortBy') || 'recent';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    // Load categories for filter sidebar
    api.get<{ success: boolean; data: Category[] }>('/api/categories').then((res) => {
      if (res.success) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    async function fetchResources() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: '12',
          sortBy,
        });

        if (q) queryParams.set('q', q);
        if (categoryId) queryParams.set('categoryId', categoryId);
        if (tag) queryParams.set('tag', tag);
        if (academicLevel && academicLevel !== 'all') queryParams.set('academicLevel', academicLevel);
        if (fileExtension && fileExtension !== 'all') queryParams.set('fileExtension', fileExtension);

        const res = await api.get<{
          success: boolean;
          data: {
            items: Resource[];
            total: number;
            totalPages: number;
          };
        }>(`/api/resources?${queryParams.toString()}`);

        if (res.success) {
          setResources(res.data.items);
          setTotal(res.data.total);
          setTotalPages(res.data.totalPages);
        }
      } catch (err) {
        console.error('Failed to query resources:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, [q, categoryId, tag, academicLevel, fileExtension, sortBy, page]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('q', searchInput);
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Academic Discovery Catalog
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Browse verified lecture notes, problem sets, and presentations.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative w-full">
            <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by topic, course, formula..."
              className="w-full ps-10 pe-4 py-2 text-sm rounded-xl border border-border bg-card focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>
      </div>

      {/* Main Layout: Filters + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 rounded-2xl border border-border bg-card space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <span className="font-bold text-sm text-foreground flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <span>Filters</span>
              </span>
              {(categoryId || tag || academicLevel || fileExtension || q) && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Discipline / Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Discipline
              </label>
              <select
                value={categoryId}
                onChange={(e) => updateParam('categoryId', e.target.value)}
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 outline-none focus:border-primary"
              >
                <option value="">All Disciplines</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Academic Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Academic Level
              </label>
              <select
                value={academicLevel}
                onChange={(e) => updateParam('academicLevel', e.target.value)}
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 outline-none focus:border-primary"
              >
                <option value="">All Levels</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="postgraduate">Postgraduate & Research</option>
                <option value="high_school">High School</option>
                <option value="professional">Professional</option>
              </select>
            </div>

            {/* File Format Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                File Format
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { label: 'All Formats', val: '' },
                  { label: 'PDF', val: 'pdf' },
                  { label: 'Slides (PPTX)', val: 'pptx' },
                  { label: 'Docs (DOCX)', val: 'docx' },
                  { label: 'Sheets (XLSX)', val: 'xlsx' },
                  { label: 'Images', val: 'png' },
                ].map((f) => (
                  <button
                    key={f.val}
                    onClick={() => updateParam('fileExtension', f.val)}
                    className={`px-2.5 py-1.5 rounded-lg border text-start transition-all font-medium ${
                      fileExtension === f.val || (!fileExtension && !f.val)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Results Summary Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border text-xs">
            <span className="text-muted-foreground">
              Showing <strong className="text-foreground">{resources.length}</strong> of{' '}
              <strong className="text-foreground">{total}</strong> resources
            </span>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => updateParam('sortBy', e.target.value)}
                className="rounded-lg border border-border bg-background px-2.5 py-1 font-medium text-foreground outline-none"
              >
                <option value="recent">Recently Added</option>
                <option value="downloads">Most Downloaded</option>
                <option value="bookmarks">Most Bookmarked</option>
                <option value="views">Most Viewed</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-foreground">{t('noResults')}</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try adjusting your search query, clearing filters, or browsing other academic categories.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {resources.map((res) => (
                <ResourceCard key={res.id} resource={res} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParam('page', (page - 1).toString())}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>
              <span className="text-xs text-muted-foreground px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateParam('page', (page + 1).toString())}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
