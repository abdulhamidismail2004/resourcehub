import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceTitle: string;
  onDeleted: () => void;
}

export const DeleteResourceModal: React.FC<DeleteResourceModalProps> = ({
  isOpen,
  onClose,
  resourceId,
  resourceTitle,
  onDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg('');

    try {
      const res = await api.delete<{ success: boolean; message?: string }>(
        `/api/resources/${resourceId}`
      );
      if (res.success) {
        onDeleted();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete resource. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Resource"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-destructive">
            <p className="font-bold text-sm">Warning: This action is permanent</p>
            <p>
              Are you sure you want to delete <span className="font-semibold underline">"{resourceTitle}"</span>?
              All associated files, bookmarks, study collections, and download statistics will be permanently removed.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            isLoading={isDeleting}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirm Delete</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
