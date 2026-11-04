import React, { useState } from 'react';
import { Resource } from '@resourcehub/shared';
import { FileText, Download, ExternalLink, Presentation, FileSpreadsheet, Eye } from 'lucide-react';
import { Button } from '../ui/Button';

interface FilePreviewProps {
  resource: Resource;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ resource }) => {
  const [fullscreen, setFullscreen] = useState(false);
  const ext = resource.file?.fileExtension?.toLowerCase() || 'pdf';
  const previewUrl = `/api/resources/${resource.id}/preview`;
  const downloadUrl = `/api/resources/${resource.id}/download`;

  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

  if (isPdf) {
    return (
      <div className="w-full flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <FileText className="w-4 h-4 text-rose-500" />
            <span>Interactive PDF Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in new tab</span>
            </a>
          </div>
        </div>

        <div className="w-full h-[650px] bg-muted/20">
          <iframe
            src={`${previewUrl}#toolbar=1`}
            title={resource.title}
            className="w-full h-full border-none"
          />
        </div>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="w-full flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 bg-muted/20 flex items-center justify-center min-h-[400px]">
          <img
            src={previewUrl}
            alt={resource.title}
            className="max-h-[600px] w-auto rounded-xl object-contain shadow-lg"
          />
        </div>
      </div>
    );
  }

  // Office documents (PPTX, DOCX, XLSX)
  return (
    <div className="w-full rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center text-center gap-4">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
        {ext === 'pptx' || ext === 'ppt' ? (
          <Presentation className="w-10 h-10 text-amber-500" />
        ) : ext === 'xlsx' || ext === 'xls' ? (
          <FileSpreadsheet className="w-10 h-10 text-emerald-500" />
        ) : (
          <FileText className="w-10 h-10 text-sky-500" />
        )}
      </div>

      <div className="max-w-md space-y-1">
        <h4 className="text-base font-bold text-foreground">
          {resource.file?.originalName || resource.title}
        </h4>
        <p className="text-xs text-muted-foreground">
          This educational {ext.toUpperCase()} document can be downloaded and opened in your favorite office suite.
        </p>
      </div>

      <a href={downloadUrl} download>
        <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
          <Download className="w-4 h-4" />
          <span>Download & Open Document</span>
        </Button>
      </a>
    </div>
  );
};
