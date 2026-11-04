import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { api } from '../lib/api';
import { ResourceCard } from '../components/resources/ResourceCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import {
  GraduationCap,
  Calendar,
  School,
  Download,
  FileText,
  Layers,
  Edit3,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, updateUser } = useAuth();
  const { t } = useLocale();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [institution, setInstitution] = useState('');
  const [bio, setBio] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const isOwner = currentUser?.id === id;

  useEffect(() => {
    async function loadProfile() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; data: any }>(`/api/users/${id}/profile`);
        if (res.success) {
          setProfileData(res.data);
          setDisplayName(res.data.user.displayName);
          setInstitution(res.data.user.institution || '');
          setBio(res.data.user.bio || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [id]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      const res = await api.patch<{ success: boolean; data: { user: any } }>('/api/auth/profile', {
        displayName,
        institution,
        bio,
      });

      if (res.success) {
        updateUser(res.data.user);
        setProfileData((prev: any) => ({
          ...prev,
          user: { ...prev.user, ...res.data.user },
        }));
        setEditModalOpen(false);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl space-y-8">
        <div className="h-44 rounded-3xl bg-muted/40 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-2xl font-bold">User Not Found</h2>
        <Link to="/discover">
          <Button variant="outline">Browse Platform Resources</Button>
        </Link>
      </div>
    );
  }

  const { user, stats, resources, collections } = profileData;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-5xl space-y-8">
      {/* Header Profile Card */}
      <div className="p-8 rounded-3xl border border-border bg-card shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-extrabold text-2xl flex items-center justify-center ring-4 ring-primary/20 shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
            ) : (
              user.displayName.charAt(0).toUpperCase()
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{user.displayName}</h1>
              <Badge variant="default" size="sm" className="uppercase font-bold text-[10px]">
                {user.role}
              </Badge>
            </div>
            {user.institution && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <School className="w-4 h-4 text-primary" />
                <span>{user.institution}</span>
              </p>
            )}
            {user.bio && <p className="text-xs text-foreground/80 pt-1 max-w-md">{user.bio}</p>}
          </div>
        </div>

        {isOwner && (
          <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)} className="gap-1.5 shrink-0">
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </Button>
        )}
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm text-center space-y-1">
          <div className="text-3xl font-extrabold text-foreground">{stats.resourcesCount}</div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Resources Published
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm text-center space-y-1">
          <div className="text-3xl font-extrabold text-primary">{stats.downloadsCount}</div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Downloads Generated
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm text-center space-y-1">
          <div className="text-3xl font-extrabold text-foreground">{stats.collectionsCount}</div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Public Collections
          </div>
        </div>
      </div>

      {/* Published Materials Grid */}
      <div className="space-y-6 pt-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <span>Published Resources ({resources.length})</span>
        </h2>

        {resources.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card text-xs text-muted-foreground">
            No public resources published by this user yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((res: any) => (
              <ResourceCard
                key={res.id}
                resource={{
                  ...res,
                  author: {
                    id: user.id,
                    displayName: user.displayName,
                    avatarUrl: user.avatarUrl,
                    institution: user.institution,
                  },
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profile"
        description="Update your academic scholar profile details."
      >
        <form onSubmit={handleProfileSave} className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />

          <Input
            label="Academic Institution / University"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g. Stanford University"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Academic Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief summary of your field of study or research focus..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isUpdating}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
