import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { api } from '../lib/api';
import { Category } from '@resourcehub/shared';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const UploadPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subject, setSubject] = useState('');
  const [academicLevel, setAcademicLevel] = useState('undergraduate');
  const [visibility, setVisibility] = useState('public');
  const [tags, setTags] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/upload');
      return;
    }

    api.get<{ success: boolean; data: Category[] }>('/api/categories').then((res) => {
      if (res.success && res.data.length > 0) {
        setCategories(res.data);
        setCategoryId(res.data[0].id);
      }
    });
  }, [isAuthenticated, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setErrorMsg('');

      // Auto-fill title from filename if empty
      if (!title) {
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setErrorMsg('');

      if (!title) {
        const cleanName = selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select a file to upload.');
      return;
    }
    if (file.size > 4.5 * 1024 * 1024) {
      setErrorMsg(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the Vercel demo payload limit (4.5 MB). Please choose a file under 4.5 MB.`);
      return;
    }
    if (!title.trim() || !description.trim() || !subject.trim() || !categoryId) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('categoryId', categoryId);
      formData.append('subject', subject.trim());
      formData.append('academicLevel', academicLevel);
      formData.append('visibility', visibility);

      if (tags.trim()) {
        const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
        formData.append('tags', JSON.stringify(parsedTags));
      }

      const res = await api.upload<{
        success: boolean;
        data: { id: string };
        message?: string;
      }>('/api/resources/upload', formData);

      if (res.success && res.data?.id) {
        setSuccessMsg('Resource published successfully!');
        setTimeout(() => {
          navigate(`/resources/${res.data.id}`);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'File upload failed. Please verify format and size.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-4xl">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          {t('uploadResourceTitle')}
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          {t('uploadResourceSubtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Drag & Drop File Upload Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 ${
            dragOver
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : file
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
            className="hidden"
          />

          {file ? (
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-base text-foreground truncate max-w-sm">{file.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to publish
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="gap-1 mt-2 text-xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Choose Different File</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-sm">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-base text-foreground">{t('dragDropText')}</h4>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {t('supportedFormats')}
              </p>
            </div>
          )}
        </div>

        {/* 2. Metadata Form Fields */}
        <div className="p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-sm space-y-6">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Academic Details</span>
          </h3>

          <div className="grid grid-cols-1 gap-5">
            <Input
              label={t('resourceTitle')}
              placeholder={t('resourceTitlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('resourceDesc')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('resourceDescPlaceholder')}
                rows={4}
                required
                className="w-full rounded-xl border border-border bg-background/50 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('selectCategory')}
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label={t('subject')}
                placeholder={t('subjectPlaceholder')}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('selectLevel')}
                </label>
                <select
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  className="rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="undergraduate">{t('levelUndergrad')}</option>
                  <option value="postgraduate">{t('levelPostgrad')}</option>
                  <option value="high_school">{t('levelHighSchool')}</option>
                  <option value="secondary">{t('levelSecondary')}</option>
                  <option value="primary">{t('levelPrimary')}</option>
                  <option value="professional">{t('levelProfessional')}</option>
                  <option value="all">{t('levelAll')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('visibilityLabel')}
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="public">{t('visibilityPublic')}</option>
                  <option value="unlisted">{t('visibilityUnlisted')}</option>
                  <option value="private">{t('visibilityPrivate')}</option>
                </select>
              </div>
            </div>

            <Input
              label={t('tagsLabel')}
              placeholder={t('tagsPlaceholder')}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              helperText="Separate tags with commas. E.g. calculus, linear-algebra, exam-prep"
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Verified file signature checking & SHA-256 integrity</span>
            </span>

            <Button type="submit" size="lg" isLoading={isUploading} className="shadow-lg shadow-primary/20">
              {isUploading ? t('uploading') : t('submitUpload')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
