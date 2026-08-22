import { useState, useEffect } from 'react';
import {
  getFeedbacks,
  updateFeedback,
  deleteFeedback,
  isSupabaseConfigured,
} from '../../lib/supabase';
import {
  MessageSquare,
  Bug,
  Lightbulb,
  Heart,
  BookOpen,
  Search,
  Filter,
  Trash2,
  CheckCircle,
  Clock,
  Archive,
  Download,
  AlertCircle,
  Star,
  ExternalLink,
  Tag,
  ChevronDown,
} from 'lucide-react';

const TYPE_CONFIG = {
  bug: { label: 'Bug Report', icon: Bug, color: '#D32F2F', bg: '#FFF1F0' },
  feature: { label: 'Feature Idea', icon: Lightbulb, color: '#B28228', bg: '#FFF8EC' },
  general: { label: 'General', icon: Heart, color: '#2D612D', bg: '#EAF3EA' },
  content: { label: 'Bible / Content', icon: BookOpen, color: '#C46246', bg: '#FBF0EC' },
};

const STATUS_CONFIG = {
  unread: { label: 'Unread', color: '#D32F2F', bg: '#FFF1F0' },
  reviewed: { label: 'Reviewed', color: '#B28228', bg: '#FFF8EC' },
  in_progress: { label: 'In Progress', color: '#1890FF', bg: '#E6F7FF' },
  resolved: { label: 'Resolved', color: '#2D612D', bg: '#EAF3EA' },
  archived: { label: 'Archived', color: '#8C8C8C', bg: '#F5F5F5' },
};

export default function FeedbackManager() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notice, setNotice] = useState(null);
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');

  const fetchList = async () => {
    try {
      setLoading(true);
      const data = await getFeedbacks();
      setFeedbacks(data);
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err);
      setNotice({ type: 'error', text: err.message || 'Failed to load feedbacks.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateFeedback(id, { status: newStatus });
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
      );
      setNotice({ type: 'success', text: `Feedback marked as ${newStatus}.` });
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
      setNotice({ type: 'error', text: err.message || 'Failed to update status.' });
    }
  };

  const handleSaveNotes = async (id) => {
    try {
      await updateFeedback(id, { admin_notes: notesDraft });
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, admin_notes: notesDraft } : f))
      );
      setEditingNotesId(null);
      setNotice({ type: 'success', text: 'Admin notes saved.' });
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      console.error('Failed to save notes:', err);
      setNotice({ type: 'error', text: err.message || 'Failed to save notes.' });
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete feedback "${item.subject}"?`)) return;
    try {
      await deleteFeedback(item.id);
      setFeedbacks((prev) => prev.filter((f) => f.id !== item.id));
      setNotice({ type: 'success', text: 'Feedback deleted.' });
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      console.error('Failed to delete feedback:', err);
      setNotice({ type: 'error', text: err.message || 'Failed to delete.' });
    }
  };

  const handleExportCSV = () => {
    if (feedbacks.length === 0) return;

    const headers = ['ID', 'Type', 'Status', 'Subject', 'Message', 'Rating', 'Name', 'Email', 'Created At', 'Admin Notes'];
    const rows = feedbacks.map((f) => [
      f.id,
      f.type,
      f.status,
      `"${(f.subject || '').replace(/"/g, '""')}"`,
      `"${(f.message || '').replace(/"/g, '""')}"`,
      f.rating || '',
      `"${(f.name || '').replace(/"/g, '""')}"`,
      f.email || '',
      f.created_at,
      `"${(f.admin_notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shepema_feedback_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered List
  const filtered = feedbacks.filter((f) => {
    if (filterType !== 'all' && f.type !== filterType) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSub = f.subject?.toLowerCase().includes(q);
      const matchMsg = f.message?.toLowerCase().includes(q);
      const matchEmail = f.email?.toLowerCase().includes(q);
      const matchName = f.name?.toLowerCase().includes(q);
      if (!matchSub && !matchMsg && !matchEmail && !matchName) return false;
    }
    return true;
  });

  const unreadCount = feedbacks.filter((f) => f.status === 'unread').length;
  const bugCount = feedbacks.filter((f) => f.type === 'bug').length;
  const featureCount = feedbacks.filter((f) => f.type === 'feature').length;

  return (
    <div>
      <div className="admin-card">
        {/* Header */}
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              <MessageSquare size={22} color="var(--brand-green)" />
              User Feedback & Bug Reports
            </h2>
            <p className="admin-card-desc">
              Review issues, feature ideas, and devotional feedback submitted by Shepema app users.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <span
                style={{
                  background: '#FFF1F0',
                  color: '#D32F2F',
                  border: '1px solid #FFCCC7',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                {unreadCount} Unread
              </span>
            )}
            <button
              className="btn-admin btn-admin-secondary"
              onClick={handleExportCSV}
              disabled={feedbacks.length === 0}
              title="Export to CSV"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Notice Banner */}
        {notice && (
          <div
            style={{
              background: notice.type === 'success' ? '#EAF5EA' : '#FFF1F0',
              border: `1px solid ${notice.type === 'success' ? '#A3D9A5' : '#FFCCC7'}`,
              color: notice.type === 'success' ? '#1B5E20' : '#C62828',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
            }}
          >
            {notice.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* Quick Stats Chips */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div
            style={{
              background: 'var(--paper-bg)',
              border: '1px solid var(--paper-line)',
              borderRadius: '12px',
              padding: '0.6rem 1rem',
              fontSize: '0.85rem',
            }}
          >
            <strong>Total Submissions:</strong> {feedbacks.length}
          </div>
          <div
            style={{
              background: '#FFF1F0',
              border: '1px solid #FFCCC7',
              color: '#D32F2F',
              borderRadius: '12px',
              padding: '0.6rem 1rem',
              fontSize: '0.85rem',
            }}
          >
            <strong>🐛 Bugs Reported:</strong> {bugCount}
          </div>
          <div
            style={{
              background: '#FFF8EC',
              border: '1px solid #EADBBA',
              color: '#B28228',
              borderRadius: '12px',
              padding: '0.6rem 1rem',
              fontSize: '0.85rem',
            }}
          >
            <strong>💡 Feature Ideas:</strong> {featureCount}
          </div>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: '1.5rem',
            background: 'var(--section-alt-bg)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid var(--paper-line)',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search keyword, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.4rem', height: '40px', fontSize: '0.875rem' }}
            />
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ink-muted)',
              }}
            />
          </div>

          {/* Type Filter */}
          <select
            className="form-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: 'auto', height: '40px', fontSize: '0.875rem' }}
          >
            <option value="all">All Types</option>
            <option value="bug">🐛 Bug Reports</option>
            <option value="feature">💡 Feature Ideas</option>
            <option value="general">💖 General Praise</option>
            <option value="content">📖 Bible / Content</option>
          </select>

          {/* Status Filter */}
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 'auto', height: '40px', fontSize: '0.875rem' }}
          >
            <option value="all">All Statuses</option>
            <option value="unread">Unread</option>
            <option value="reviewed">Reviewed</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-muted)' }}>
            Loading feedbacks...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3.5rem 1.5rem',
              background: 'var(--paper-bg)',
              borderRadius: '16px',
              border: '1px dashed var(--paper-line)',
            }}
          >
            <MessageSquare size={36} color="var(--ink-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ margin: '0 0 0.4rem', color: 'var(--ink-primary)' }}>No Feedbacks Found</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-secondary)' }}>
              {feedbacks.length === 0
                ? 'No user feedbacks have been submitted yet.'
                : 'No feedbacks match your current filter criteria.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map((item) => {
              const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.general;
              const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.unread;
              const TypeIcon = typeCfg.icon;

              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--card-bg, #FFFFFF)',
                    border: `1px solid ${item.status === 'unread' ? '#FFCCC7' : 'var(--paper-line)'}`,
                    borderRadius: '16px',
                    padding: '1.25rem 1.5rem',
                    boxShadow: item.status === 'unread' ? '0 4px 12px rgba(211, 47, 47, 0.06)' : '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card Header Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      marginBottom: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      {/* Type Badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: typeCfg.bg,
                          color: typeCfg.color,
                          padding: '0.3rem 0.65rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        <TypeIcon size={14} />
                        {typeCfg.label}
                      </span>

                      {/* Status Dropdown */}
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        style={{
                          background: statusCfg.bg,
                          color: statusCfg.color,
                          border: `1px solid ${statusCfg.color}40`,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <option value="unread">🔴 Unread</option>
                        <option value="reviewed">🟡 Reviewed</option>
                        <option value="in_progress">🔵 In Progress</option>
                        <option value="resolved">🟢 Resolved</option>
                        <option value="archived">⚪ Archived</option>
                      </select>

                      {/* Rating Stars */}
                      {item.rating && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', marginLeft: '0.25rem' }}>
                          {[...Array(item.rating)].map((_, i) => (
                            <Star key={i} size={14} fill="#D4A84B" color="#D4A84B" />
                          ))}
                        </span>
                      )}
                    </div>

                    {/* Date & Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                        {new Date(item.created_at).toLocaleDateString()} at{' '}
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#D32F2F',
                          cursor: 'pointer',
                          opacity: 0.6,
                          padding: '4px',
                        }}
                        title="Delete Feedback"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Subject & Message */}
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', color: 'var(--ink-primary)' }}>
                    {item.subject}
                  </h4>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.925rem', color: 'var(--ink-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {item.message}
                  </p>

                  {/* Metadata Row: Sender details */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '1.25rem',
                      flexWrap: 'wrap',
                      fontSize: '0.825rem',
                      color: 'var(--ink-muted)',
                      borderTop: '1px solid var(--paper-line)',
                      paddingTop: '0.75rem',
                    }}
                  >
                    {item.name && (
                      <span>
                        👤 <strong>{item.name}</strong>
                      </span>
                    )}
                    {item.email ? (
                      <a
                        href={`mailto:${item.email}?subject=Re: Shepema Feedback - ${encodeURIComponent(item.subject)}`}
                        style={{ color: 'var(--brand-green)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        ✉️ {item.email}
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span>✉️ Anonymous</span>
                    )}
                    {item.app_version && (
                      <span>
                        📱 Version: <strong>{item.app_version}</strong>
                      </span>
                    )}
                  </div>

                  {/* Admin Notes Box */}
                  <div style={{ marginTop: '0.75rem', background: 'var(--paper-bg)', borderRadius: '8px', padding: '0.6rem 0.85rem' }}>
                    {editingNotesId === item.id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Add internal note (e.g. Fixed in v1.0.2)..."
                          value={notesDraft}
                          onChange={(e) => setNotesDraft(e.target.value)}
                          style={{ height: '34px', fontSize: '0.825rem' }}
                        />
                        <button
                          type="button"
                          className="btn-admin"
                          style={{ padding: '0 0.75rem', height: '34px', fontSize: '0.8rem' }}
                          onClick={() => handleSaveNotes(item.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn-admin btn-admin-secondary"
                          style={{ padding: '0 0.75rem', height: '34px', fontSize: '0.8rem' }}
                          onClick={() => setEditingNotesId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.825rem',
                          color: 'var(--ink-secondary)',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setEditingNotesId(item.id);
                          setNotesDraft(item.admin_notes || '');
                        }}
                      >
                        <span>
                          📝 <strong>Admin Notes:</strong>{' '}
                          {item.admin_notes ? (
                            <span>{item.admin_notes}</span>
                          ) : (
                            <em style={{ color: 'var(--ink-muted)' }}>Click to add internal note...</em>
                          )}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--brand-green)', fontWeight: 600 }}>Edit</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
