import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { api } from '../lib/api';
import { Collection, CollectionDetail } from '@resourcehub/shared';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import {
  FolderPlus,
  Layers,
  FileText,
  Trash2,
  Lock,
  Globe,
  Plus,
  ExternalLink,
} from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // New collection modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/collections');
      return;
    }

    fetchCollections();
  }, [isAuthenticated, navigate]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; data: Collection[] }>('/api/collections');
      if (res.success) {
        setCollections(res.data);
        if (res.data.length > 0 && !selectedCollection) {
          fetchCollectionDetail(res.data[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionDetail = async (id: string) => {
    try {
      const res = await api.get<{ success: boolean; data: CollectionDetail }>(`/api/collections/${id}`);
      if (res.success) {
        setSelectedCollection(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await api.post<{ success: boolean; data: Collection }>('/api/collections', {
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });

      if (res.success) {
        setIsModalOpen(false);
        setName('');
        setDescription('');
        setIsPublic(false);
        await fetchCollections();
        fetchCollectionDetail(res.data.id);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this study collection?')) return;
    try {
      await api.delete(`/api/collections/${id}`);
      setSelectedCollection(null);
      await fetchCollections();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveItem = async (resourceId: string) => {
    if (!selectedCollection) return;
    try {
      await api.delete(`/api/collections/${selectedCollection.id}/items/${resourceId}`);
      await fetchCollectionDetail(selectedCollection.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {t('collections')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize papers and lecture notes into personal or public academic study collections.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
          <FolderPlus className="w-4 h-4" />
          <span>New Collection</span>
        </Button>
      </div>

      {loading ? (
        <div className="h-64 rounded-3xl bg-muted/40 animate-pulse" />
      ) : collections.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-border bg-card space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-foreground">No study collections yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Create collections like "Algorithms Final Prep" or "Quantum Physics Readings" to organize resources.
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="sm">
            Create First Collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Collection Selector Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
                Your Collections ({collections.length})
              </span>
              <div className="space-y-1 pt-1">
                {collections.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => fetchCollectionDetail(c.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-start transition-all font-medium text-xs ${
                      selectedCollection?.id === c.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Layers className="w-4 h-4 shrink-0" />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ms-2">
                      {c.isPublic ? <Globe className="w-3 h-3 opacity-70" /> : <Lock className="w-3 h-3 opacity-70" />}
                      <span className="text-[10px] opacity-80">{c.itemCount || 0} items</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Collection Items */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCollection ? (
              <div className="p-6 sm:p-8 rounded-3xl border border-border bg-card space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-bold text-foreground">{selectedCollection.name}</h2>
                      <Badge variant={selectedCollection.isPublic ? 'info' : 'secondary'} size="sm">
                        {selectedCollection.isPublic ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                    {selectedCollection.description && (
                      <p className="text-xs text-muted-foreground">{selectedCollection.description}</p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCollection(selectedCollection.id)}
                    className="text-destructive hover:bg-destructive/10 gap-1.5 self-start sm:self-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </Button>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Included Resources ({selectedCollection.items?.length || 0})
                  </h3>

                  {selectedCollection.items && selectedCollection.items.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCollection.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl border border-border bg-background flex items-center justify-between gap-4 hover:border-primary/40 transition-colors"
                        >
                          <div className="space-y-1 truncate">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" size="sm" className="font-mono uppercase text-[10px]">
                                {item.fileExtension || 'PDF'}
                              </Badge>
                              <Link
                                to={`/resources/${item.resourceId}`}
                                className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate"
                              >
                                {item.title}
                              </Link>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.categoryName} • Author: {item.authorName} • {item.downloadCount} downloads
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Link to={`/resources/${item.resourceId}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.resourceId)}
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                      No resources in this collection yet. Browse the catalog to add items!
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* New Collection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Collection"
        description="Create a personal or public collection to organize academic resources."
      >
        <form onSubmit={handleCreateCollection} className="space-y-4">
          <Input
            label="Collection Name"
            placeholder="e.g., Graduate Machine Learning Papers"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief focus for this list..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background/50">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary"
            />
            <label htmlFor="isPublic" className="text-xs font-medium text-foreground cursor-pointer">
              Make this collection public (Visible on your profile for other students)
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Create Collection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
