import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';
import { Category } from '@resourcehub/shared';
import { AlertCircle, CheckCircle, Save } from 'lucide-react';

interface EditResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    subject: string;
    academicLevel: string;
    visibility: string;
    tags?: Array<{ id: string; name: string }>;
  };
  onSuccess: (updated: any) => void;
}

export const EditResourceModal: React.FC<EditResourceModalProps> = ({
  isOpen,
  onClose,
  resource,
  onSuccess,
}) => {
  const [title, setTitle] = useState(resource.title);
  const [description, setDescription] = useState(resource.description);
  const [categoryId, setCategoryId] = useState(resource.categoryId);
  const [subject, setSubject] = useState(resource.subject);
  const [academicLevel, setAcademicLevel] = useState(resource.academicLevel || 'undergraduate');
  const [visibility, setVisibility] = useState(resource.visibility || 'public');
  const [tags, setTags] = useState(
    resource.tags ? resource.tags.map((t) => t.name).join(', ') : ''
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(resource.title);
      setDescription(resource.description);
      setCategoryId(resource.categoryId);
      setSubject(resource.subject);
      setAcademicLevel(resource.academicLevel || 'undergraduate');
      setVisibility(resource.visibility || 'public');
      setTags(resource.tags ? resource.tags.map((t) => t.name).join(', ') : '');
      setErrorMsg('');
      setSuccessMsg('');

      api.get<{ success: boolean; data: Category[] }>('/api/categories').then((res) => {
        if (res.success && res.data.length > 0) {
          setCategories(res.data);
        }
      });
    }
  }, [isOpen, resource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !subject.trim() || !categoryId) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        subject: subject.trim(),
        academicLevel,
        visibility,
        tags: parsedTags,
      };

      const res = await api.patch<{ success: boolean; data: any; message?: string }>(
        `/api/resources/${resource.id}`,
        payload
      );

      if (res.success) {
        setSuccessMsg('Resource updated successfully!');
        const cat = categories.find((c) => c.id === categoryId);
        onSuccess({
          ...res.data,
          category: cat ? { id: cat.id, name: cat.name, slug: cat.slug } : undefined,
          tags: parsedTags.map((name, i) => ({ id: `new-${i}`, name, slug: name.toLowerCase() })),
        });
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update resource.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Resource"
      description="Update academic metadata and visibility settings for this resource."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Resource Title *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Quantum Computing Basics"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Description & Abstract *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Summary of lecture notes, topics covered..."
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Subject *
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics, Calculus"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Academic Level
            </label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Levels</option>
              <option value="primary">Primary School</option>
              <option value="secondary">Middle / Secondary</option>
              <option value="high_school">High School</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="professional">Professional / Research</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="public">Public (Everyone)</option>
              <option value="unlisted">Unlisted (Link only)</option>
              <option value="private">Private (Only me)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Tags (comma-separated)
          </label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. notes, exam, midterm, cheetsheet"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} className="gap-2">
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
