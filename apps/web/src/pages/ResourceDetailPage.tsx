import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { api } from '../lib/api';
import { ResourceDetail, Resource } from '@resourcehub/shared';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { FilePreview } from '../components/resources/FilePreview';
import { ResourceCard } from '../components/resources/ResourceCard';
import { EditResourceModal } from '../components/resources/EditResourceModal';
import { DeleteResourceModal } from '../components/resources/DeleteResourceModal';
import {
  Download,
  Bookmark,
  Share2,
  Flag,
  ArrowLeft,
  Calendar,
  School,
  Eye,
  Check,
  CheckCircle,
  FileText,
  Edit3,
  Trash2,
} from 'lucide-react';

export const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('copyright');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Edit & Delete modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const isAuthor = user?.id === resource?.userId || user?.id === resource?.author?.id;
  const isModOrAdmin = user?.role === 'admin' || user?.role === 'moderator';
  const canManage = Boolean(isAuthenticated && (isAuthor || isModOrAdmin));

  useEffect(() => {
    async function fetchResource() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.get<{ success: boolean; data: ResourceDetail }>(`/api/resources/${id}`);
        if (res.success) {
          setResource(res.data);
          setIsBookmarked(res.data.isBookmarked ?? false);
        }
      } catch (err) {
        console.error('Failed to load resource:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchResource();
  }, [id]);

  const handleDownload = async () => {
    if (!resource) return;
    try {
      setDownloading(true);
      // Trigger browser download via anchor
      const link = document.createElement('a');
      link.href = `/api/resources/${resource.id}/download`;
      link.download = resource.file?.originalName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Increment count locally
      setResource((prev) => (prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : null));
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated || !resource) {
      navigate('/login');
      return;
    }

    try {
      setBookmarkLoading(true);
      const res = await api.post<{ success: boolean; bookmarked: boolean }>(
        `/api/resources/${resource.id}/bookmark`
      );
      if (res.success) {
        setIsBookmarked(res.bookmarked);
        setResource((prev) =>
          prev
            ? {
                ...prev,
                bookmarkCount: res.bookmarked ? prev.bookmarkCount + 1 : Math.max(prev.bookmarkCount - 1, 0),
              }
            : null
        );
      }
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !resource) {
      navigate('/login');
      return;
    }

    try {
      setReportSubmitting(true);
      const res = await api.post('/api/moderation/reports', {
        resourceId: resource.id,
        reason: reportReason,
        details: reportDetails,
      });
      if (res) {
        setReportSuccess(true);
        setTimeout(() => {
          setReportSuccess(false);
          setReportModalOpen(false);
          setReportDetails('');
        }, 1800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 space-y-6 max-w-5xl">
        <div className="h-8 w-40 bg-muted/60 rounded-xl animate-pulse" />
        <div className="h-48 bg-muted/40 rounded-2xl animate-pulse" />
        <div className="h-96 bg-muted/30 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold">Resource Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested resource could not be found or has been removed.</p>
        <Link to="/discover">
          <Button variant="outline">Browse All Resources</Button>
        </Link>
      </div>
    );
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to catalog</span>
        </button>
      </div>

      {/* Main Resource Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-sm space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" size="md" className="font-bold">
            {resource.category?.name || resource.subject}
          </Badge>
          <Badge variant="secondary" size="md">
            Level: {resource.academicLevel}
          </Badge>
          <Badge variant="outline" size="md" className="uppercase font-mono">
            {resource.file?.fileExtension || 'PDF'}
          </Badge>
          {resource.file?.fileSize && (
            <span className="text-xs text-muted-foreground">
              {formatFileSize(resource.file.fileSize)}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
          {resource.title}
        </h1>

        {/* Author & Publication meta */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${resource.author?.id}`} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm ring-2 ring-primary/20">
                {resource.author?.avatarUrl ? (
                  <img
                    src={resource.author.avatarUrl}
                    alt={resource.author.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  resource.author?.displayName?.charAt(0) || 'U'
                )}
              </div>
              <div>
                <p className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">
                  {resource.author?.displayName}
                </p>
                {resource.author?.institution && (
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <School className="w-3.5 h-3.5" />
                    <span>{resource.author.institution}</span>
                  </p>
                )}
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Download className="w-4 h-4 text-emerald-500" />
              <span>{resource.downloadCount} Downloads</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="w-4 h-4 text-sky-500" />
              <span>{resource.viewCount} Views</span>
            </span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button size="lg" onClick={handleDownload} isLoading={downloading} className="gap-2 shadow-lg shadow-primary/20">
            <Download className="w-4 h-4" />
            <span>{t('downloadResource')}</span>
          </Button>

          <Button
            variant={isBookmarked ? 'secondary' : 'outline'}
            size="lg"
            onClick={handleBookmarkToggle}
            isLoading={bookmarkLoading}
            className="gap-2"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
            <span>{isBookmarked ? t('bookmarked') : t('bookmark')}</span>
          </Button>

          <Button variant="outline" size="lg" onClick={handleShare} className="gap-2">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Share'}</span>
          </Button>

          {canManage && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setEditModalOpen(true)}
                className="gap-2 text-primary border-primary/40 hover:bg-primary/10"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Resource</span>
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={() => setDeleteModalOpen(true)}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </Button>
            </div>
          )}

          <button
            onClick={() => setReportModalOpen(true)}
            className="ms-auto p-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Report this resource"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* In-Browser Document Preview */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span>{t('previewDocument')}</span>
        </h2>
        <FilePreview resource={resource} />
      </section>

      {/* Detailed Description & Tags */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border bg-card space-y-6">
        <div>
          <h3 className="text-base font-bold text-foreground uppercase tracking-wider mb-2">Description & Abstract</h3>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {resource.description}
          </p>
        </div>

        {resource.tags && resource.tags.length > 0 && (
          <div className="pt-4 border-t border-border/50 space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Classification Tags</h4>
            <div className="flex flex-wrap gap-2">
              {resource.tags.map((t) => (
                <Link
                  key={t.id}
                  to={`/discover?tag=${t.slug}`}
                  className="px-3 py-1 rounded-lg bg-muted text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Resources */}
      {resource.relatedResources && resource.relatedResources.length > 0 && (
        <section className="space-y-4 pt-6">
          <h3 className="text-xl font-bold tracking-tight text-foreground">{t('relatedMaterials')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resource.relatedResources.map((rel: any) => (
              <ResourceCard key={rel.id} resource={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Content Report Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="Report Resource"
        description="Submit an academic or copyright violation for review by moderators."
      >
        {reportSuccess ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-lg">Report Submitted</h3>
            <p className="text-xs text-muted-foreground">Thank you. Our moderation team will investigate this issue.</p>
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="copyright">Copyright Infringement / Plagiarism</option>
                <option value="inappropriate">Inappropriate or Offensive Material</option>
                <option value="broken_file">Broken File or Missing Pages</option>
                <option value="low_quality">Low Quality / Inaccurate Formulation</option>
                <option value="spam">Spam or Commercial Promotion</option>
                <option value="other">Other Issue</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">Additional Details</label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Explain the reason for reporting this resource..."
                rows={3}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setReportModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" size="sm" isLoading={reportSubmitting}>
                Submit Report
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Resource Modal */}
      {resource && (
        <EditResourceModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          resource={resource}
          onSuccess={(updated) => {
            setResource((prev) => (prev ? { ...prev, ...updated } : null));
          }}
        />
      )}

      {/* Delete Resource Modal */}
      {resource && (
        <DeleteResourceModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          resourceId={resource.id}
          resourceTitle={resource.title}
          onDeleted={() => {
            navigate('/discover');
          }}
        />
      )}
    </div>
  );
};
