import React from 'react';
import { Link } from 'react-router-dom';
import { Resource } from '@resourcehub/shared';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Image,
  Download,
  Bookmark,
  Eye,
  School,
} from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onBookmarkToggled?: (resourceId: string, isBookmarked: boolean) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onBookmarkToggled }) => {
  const { isAuthenticated } = useAuth();
  const [isBookmarked, setIsBookmarked] = React.useState(resource.isBookmarked ?? false);
  const [bookmarkLoading, setBookmarkLoading] = React.useState(false);

  const getFormatIcon = (ext?: string) => {
    switch (ext?.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'pptx':
      case 'ppt':
        return <Presentation className="w-4 h-4 text-amber-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-4 h-4 text-sky-500" />;
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
        return <Image className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-primary" />;
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;

    try {
      setBookmarkLoading(true);
      const res = await api.post<{ success: boolean; bookmarked: boolean }>(
        `/api/resources/${resource.id}/bookmark`
      );
      if (res.success) {
        setIsBookmarked(res.bookmarked);
        onBookmarkToggled?.(resource.id, res.bookmarked);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const fileExt = resource.file?.fileExtension || 'pdf';

  return (
    <Link
      to={`/resources/${resource.id}`}
      className="group flex flex-col rounded-2xl border border-border/70 bg-card hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden relative"
    >
      {/* Thumbnail or Category Visual */}
      <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center overflow-hidden border-b border-border/40">
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/60 p-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-background/80 shadow-sm flex items-center justify-center text-primary">
              {getFormatIcon(fileExt)}
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider">{resource.category?.name || resource.subject}</span>
          </div>
        )}

        {/* Format Badge overlay */}
        <div className="absolute start-3 top-3 flex items-center gap-1.5 bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm border border-border/50">
          {getFormatIcon(fileExt)}
          <span>{fileExt}</span>
        </div>

        {/* Bookmark Action */}
        {isAuthenticated && (
          <button
            onClick={handleBookmarkClick}
            disabled={bookmarkLoading}
            className="absolute end-3 top-3 p-2 rounded-xl bg-background/90 backdrop-blur-md border border-border/50 text-foreground hover:text-primary transition-all shadow-sm active:scale-95"
            title="Save bookmark"
          >
            <Bookmark
              className={`w-4 h-4 ${isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Category & Academic Level */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <Badge variant="secondary" size="sm" className="font-semibold truncate">
            {resource.category?.name || resource.subject}
          </Badge>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {resource.academicLevel}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {resource.title}
        </h3>

        {/* Description Snippet */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {resource.description}
        </p>

        {/* Author & Metrics Footer */}
        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          {/* Author */}
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] shrink-0">
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
            <span className="font-medium truncate text-foreground/80">{resource.author?.displayName}</span>
          </div>

          {/* Download Count */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1 font-semibold text-foreground/90">
              <Download className="w-3.5 h-3.5 text-primary" />
              {resource.downloadCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
