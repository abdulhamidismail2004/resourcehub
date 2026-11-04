import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { api } from '../lib/api';
import { PlatformStats } from '@resourcehub/shared';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Shield,
  Users,
  FileText,
  Download,
  AlertTriangle,
  HardDrive,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  History,
  Clock,
  Eye,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<PlatformStats | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'reports' | 'users' | 'audit'>('pending');
  const [loading, setLoading] = useState(true);

  // Pending queue
  const [pendingItems, setPendingItems] = useState<any[]>([]);

  // Reports
  const [reports, setReports] = useState<any[]>([]);

  // Users management
  const [usersList, setUsersList] = useState<any[]>([]);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Action status message
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (!hasRole(['moderator', 'admin'])) {
      navigate('/');
      return;
    }

    loadAdminData();
  }, [hasRole, navigate]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [mRes, pRes, rRes, uRes, aRes] = await Promise.all([
        api.get<{ success: boolean; data: PlatformStats }>('/api/admin/metrics'),
        api.get<{ success: boolean; data: any[] }>('/api/moderation/pending'),
        api.get<{ success: boolean; data: any[] }>('/api/moderation/reports'),
        api.get<{ success: boolean; data: { items: any[] } }>('/api/admin/users'),
        api.get<{ success: boolean; data: any[] }>('/api/admin/audit-logs'),
      ]);

      if (mRes.success) setMetrics(mRes.data);
      if (pRes.success) setPendingItems(pRes.data);
      if (rRes.success) setReports(rRes.data);
      if (uRes.success) setUsersList(uRes.data.items);
      if (aRes.success) setAuditLogs(aRes.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  // Moderate Pending Resource
  const handleResourceAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await api.post(`/api/moderation/resources/${id}/action`, { action });
      if (res) {
        showNotification(`Resource has been ${action}d.`);
        setPendingItems((prev) => prev.filter((item) => item.id !== id));
        loadAdminData();
      }
    } catch (err: any) {
      showNotification(err.message || 'Action failed');
    }
  };

  // Resolve / Dismiss Report
  const handleReportAction = async (id: string, status: 'resolved' | 'dismissed') => {
    try {
      await api.patch(`/api/moderation/reports/${id}`, { status });
      showNotification(`Report marked as ${status}.`);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err: any) {
      showNotification(err.message || 'Action failed');
    }
  };

  // Toggle user suspension
  const handleToggleSuspend = async (userId: string) => {
    try {
      const res = await api.post<{ success: boolean; isSuspended: boolean }>(
        `/api/admin/users/${userId}/suspend`
      );
      if (res.success) {
        showNotification(`User account status updated.`);
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isSuspended: res.isSuspended } : u))
        );
      }
    } catch (err: any) {
      showNotification(err.message || 'Failed to update suspension');
    }
  };

  // Change user role
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      showNotification(`User role updated to ${newRole}.`);
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      showNotification(err.message || 'Role change failed');
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 MB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl space-y-8">
        <div className="h-10 w-48 bg-muted/60 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {t('adminDashboard')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage academic review submissions, content reports, user permissions, and audit logs.
          </p>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold animate-in fade-in">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>Users</span>
            </div>
            <div className="text-2xl font-extrabold text-foreground">{metrics.totalUsers}</div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-500" />
              <span>Resources</span>
            </div>
            <div className="text-2xl font-extrabold text-foreground">{metrics.totalResources}</div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Downloads</span>
            </div>
            <div className="text-2xl font-extrabold text-foreground">{metrics.totalDownloads}</div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Pending</span>
            </div>
            <div className="text-2xl font-extrabold text-amber-500">{metrics.pendingApprovals}</div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Reports</span>
            </div>
            <div className="text-2xl font-extrabold text-rose-500">{metrics.openReports}</div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-1">
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-purple-500" />
              <span>Storage</span>
            </div>
            <div className="text-xl font-extrabold text-foreground truncate">
              {formatBytes(metrics.totalStorageBytes)}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'pending'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Pending Review ({pendingItems.length})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'reports'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            Content Reports ({reports.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'users'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            User Roles & Permissions ({usersList.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'audit'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            System Audit Trail ({auditLogs.length})
          </button>
        </div>

        {/* Tab 1: Pending Review */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingItems.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card text-xs text-muted-foreground">
                <CheckCircle className="w-10 h-10 text-emerald-500/70 mx-auto mb-2" />
                <p className="font-semibold text-sm text-foreground">Review Queue is Clear</p>
                <p className="text-muted-foreground mt-1">All uploaded educational resources have been processed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <Badge variant="warning" size="sm">Pending Approval</Badge>
                        <Badge variant="secondary" size="sm">{item.categoryName}</Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {item.fileExtension?.toUpperCase()} • {formatBytes(Number(item.fileSize))}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-foreground">{item.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Uploaded by: <strong>{item.authorName}</strong> ({item.authorEmail}) on {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/resources/${item.id}`} target="_blank">
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Eye className="w-4 h-4" />
                          <span>Inspect</span>
                        </Button>
                      </Link>

                      <Button
                        size="sm"
                        onClick={() => handleResourceAction(item.id, 'approve')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleResourceAction(item.id, 'reject')}
                        className="gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card text-xs text-muted-foreground">
                No user reports filed.
              </div>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-5 rounded-2xl border border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={rep.status === 'pending' ? 'destructive' : 'secondary'}
                        size="sm"
                        className="uppercase font-bold"
                      >
                        {rep.status}
                      </Badge>
                      <Badge variant="outline" size="sm" className="capitalize">
                        Reason: {rep.reason.replace('_', ' ')}
                      </Badge>
                    </div>

                    <p className="font-bold text-sm text-foreground">
                      Resource: <Link to={`/resources/${rep.resourceId}`} className="text-primary hover:underline">{rep.resourceTitle}</Link>
                    </p>
                    {rep.details && <p className="text-xs text-foreground/80">{rep.details}</p>}
                    <p className="text-[11px] text-muted-foreground">
                      Reported by: {rep.reporterName} ({rep.reporterEmail}) on {new Date(rep.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {rep.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReportAction(rep.id, 'dismissed')}
                      >
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReportAction(rep.id, 'resolved')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Users */}
        {activeTab === 'users' && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4 text-start">User / Scholar</th>
                    <th className="p-4 text-start">Email</th>
                    <th className="p-4 text-start">Role</th>
                    <th className="p-4 text-start">Status</th>
                    <th className="p-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-bold text-foreground flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {u.displayName.charAt(0)}
                        </div>
                        <span>{u.displayName}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">{u.email}</td>
                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold outline-none uppercase"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td className="p-4">
                        {u.isSuspended ? (
                          <Badge variant="destructive" size="sm">Suspended</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Active</Badge>
                        )}
                      </td>
                      <td className="p-4 text-end">
                        <Button
                          variant={u.isSuspended ? 'outline' : 'destructive'}
                          size="sm"
                          onClick={() => handleToggleSuspend(u.id)}
                          className="text-xs h-7"
                        >
                          {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Audit Logs */}
        {activeTab === 'audit' && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recent System Activity
            </h3>
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-border/50 bg-background/50 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Badge variant="secondary" size="sm" className="font-mono">
                      {log.action}
                    </Badge>
                    <span className="font-medium text-foreground truncate">
                      {log.userDisplayName ? `${log.userDisplayName} (${log.userEmail})` : 'System'}
                    </span>
                    {log.targetType && (
                      <span className="text-muted-foreground truncate">
                        Target: {log.targetType}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-muted-foreground">
                    <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                    <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
