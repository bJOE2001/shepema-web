import { useState, useEffect, useRef } from 'react';
import {
  getAllReleases,
  createRelease,
  updateRelease,
  deleteRelease,
  uploadApkFile,
  formatFileSize,
  isSupabaseConfigured,
} from '../../lib/supabase';
import {
  UploadCloud,
  Plus,
  Trash2,
  CheckCircle,
  ExternalLink,
  Download,
  Send,
  FileCode,
  Sparkles,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function ReleaseManager({ onOpenEmailBroadcast }) {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRelease, setEditingRelease] = useState(null);

  // Form State
  const [version, setVersion] = useState('');
  const [versionCode, setVersionCode] = useState(1);
  const [title, setTitle] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [apkUrl, setApkUrl] = useState('');
  const [apkSize, setApkSize] = useState('~138 MB');
  const [minAndroid, setMinAndroid] = useState('Android 8.0+');
  const [isLatest, setIsLatest] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [notifySubscribers, setNotifySubscribers] = useState(true);
  const [saving, setSaving] = useState(false);

  // Errors & Notices
  const [formError, setFormError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const data = await getAllReleases(true);
      setReleases(data);
    } catch (err) {
      console.error('Failed to load releases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const resetForm = () => {
    setVersion('');
    setVersionCode(1);
    setTitle('');
    setReleaseNotes('');
    setApkUrl('');
    setApkSize('~138 MB');
    setMinAndroid('Android 8.0+');
    setIsLatest(true);
    setIsPublished(true);
    setNotifySubscribers(true);
    setSaving(false);
    setFormError('');
    setEditingRelease(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setShowModal(true);
  };

  const handleVersionChange = (val) => {
    setVersion(val);
    if (!title || title.startsWith('Shepema v')) {
      setTitle(`Shepema ${val} Update`);
    }
    if (!apkUrl || apkUrl.includes('github.com')) {
      setApkUrl(`https://github.com/bJOE2001/shepema-web/releases/download/${val}/Shepema_${val}.apk`);
    }
  };

  const handleSaveRelease = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!version.trim()) {
      setFormError('Please provide a version string (e.g. v1.0.1)');
      return;
    }

    if (!apkUrl.trim()) {
      setFormError('Please provide the APK Download URL (e.g. from GitHub Releases).');
      return;
    }

    try {
      setSaving(true);
      const cleanVer = version.trim().startsWith('v') ? version.trim() : `v${version.trim()}`;

      const releasePayload = {
        version: cleanVer,
        version_code: parseInt(versionCode) || 1,
        title: title.trim() || `Shepema ${cleanVer} Update`,
        release_notes: releaseNotes.trim(),
        apk_url: apkUrl.trim(),
        apk_file_name: `Shepema_${cleanVer}.apk`,
        apk_size_formatted: apkSize.trim() || '~138 MB',
        min_android_version: minAndroid.trim() || 'Android 8.0+',
        is_latest: isLatest,
        is_published: isPublished,
      };

      let savedRelease;
      if (editingRelease) {
        savedRelease = await updateRelease(editingRelease.id, releasePayload);
      } else {
        savedRelease = await createRelease(releasePayload);
      }

      setSuccessNotice(`Release ${cleanVer} saved successfully!`);
      setTimeout(() => setSuccessNotice(''), 5000);

      setShowModal(false);
      await fetchReleases();

      // If user wanted to broadcast immediately, transition to email broadcaster
      if (notifySubscribers && onOpenEmailBroadcast) {
        onOpenEmailBroadcast(savedRelease || releasePayload);
      }
    } catch (err) {
      console.error('Error saving release:', err);
      setFormError(err.message || 'Failed to save release.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (rel) => {
    try {
      await updateRelease(rel.id, { is_published: !rel.is_published });
      fetchReleases();
    } catch (e) {
      console.error('Failed to toggle published:', e);
    }
  };

  const handleSetLatest = async (rel) => {
    try {
      await updateRelease(rel.id, { is_latest: true, is_published: true });
      fetchReleases();
    } catch (e) {
      console.error('Failed to set latest:', e);
    }
  };

  const handleDelete = async (rel) => {
    if (!window.confirm(`Are you sure you want to delete release ${rel.version}?`)) return;
    try {
      await deleteRelease(rel.id);
      fetchReleases();
    } catch (e) {
      console.error('Failed to delete release:', e);
    }
  };

  const totalDownloads = releases.reduce((sum, r) => sum + (r.download_count || 0), 0);
  const latestRelease = releases.find((r) => r.is_latest && r.is_published) || releases[0];

  return (
    <div>
      {/* Top Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <UploadCloud size={24} />
          </div>
          <div className="admin-stat-info">
            <h3>Total Releases</h3>
            <p>{releases.length}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon gold">
            <Sparkles size={24} />
          </div>
          <div className="admin-stat-info">
            <h3>Latest Version</h3>
            <p>{latestRelease?.version || 'v1.0.0'}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">
            <Download size={24} />
          </div>
          <div className="admin-stat-info">
            <h3>Total Downloads</h3>
            <p>{totalDownloads.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {successNotice && (
        <div
          style={{
            background: '#E8F5E9',
            border: '1px solid #C8E6C9',
            color: '#2E7D32',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <CheckCircle size={20} />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Release Manager Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              <FileCode size={22} color="var(--brand-green)" />
              App Releases & APK Builds
            </h2>
            <p className="admin-card-desc">
              Upload new Android builds to Supabase Storage and manage version rollouts.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-admin btn-admin-secondary" onClick={fetchReleases} title="Refresh">
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
            <button className="btn-admin" onClick={handleOpenNew}>
              <Plus size={18} />
              Upload New Release
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-muted)' }}>
            <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem' }} />
            <p>Loading releases from Supabase...</p>
          </div>
        ) : releases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-secondary)' }}>
            <UploadCloud size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
            <h3>No Releases Uploaded Yet</h3>
            <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem', fontSize: '0.9rem' }}>
              Upload your first `.apk` build to Supabase Storage and publish it for website visitors.
            </p>
            <button className="btn-admin" onClick={handleOpenNew}>
              <Plus size={16} /> Create First Release
            </button>
          </div>
        ) : (
          <div>
            {releases.map((rel) => (
              <div key={rel.id} className="release-item-card">
                <div className="release-item-info">
                  <span className="release-version-tag">{rel.version}</span>
                  <div className="release-item-details">
                    <h4>{rel.title || `Shepema ${rel.version}`}</h4>
                    <div className="release-meta-pills">
                      {rel.is_latest && <span className="pill-status latest">★ Latest Release</span>}
                      <span className={`pill-status ${rel.is_published ? 'published' : 'draft'}`}>
                        {rel.is_published ? '● Live on Website' : '○ Draft'}
                      </span>
                      <span>📦 {rel.apk_size_formatted || '~108 MB'}</span>
                      <span>📱 {rel.min_android_version || 'Android 8.0+'}</span>
                      <span>⬇ {rel.download_count || 0} downloads</span>
                      <span>📅 {new Date(rel.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="release-actions">
                  <a
                    href={rel.apk_url}
                    className="btn-admin btn-admin-secondary"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Download APK"
                  >
                    <Download size={14} />
                    APK
                  </a>

                  <button
                    className="btn-admin btn-admin-secondary"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => onOpenEmailBroadcast && onOpenEmailBroadcast(rel)}
                    title="Send Email Update to Subscribers"
                  >
                    <Send size={14} />
                    Notify
                  </button>

                  {!rel.is_latest && (
                    <button
                      className="btn-admin btn-admin-secondary"
                      style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => handleSetLatest(rel)}
                      title="Set as latest release"
                    >
                      Make Latest
                    </button>
                  )}

                  <button
                    className="btn-admin btn-admin-secondary"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => handleTogglePublish(rel)}
                  >
                    {rel.is_published ? 'Unpublish' : 'Publish'}
                  </button>

                  <button
                    className="btn-admin btn-admin-danger"
                    style={{ padding: '0.45rem 0.65rem' }}
                    onClick={() => handleDelete(rel)}
                    title="Delete release"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload New Release Modal */}
      {showModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <button className="modal-close-btn" onClick={() => setShowModal(false)}>
              &times;
            </button>

            <h3 style={{ fontFamily: 'var(--font-display)', margin: '0 0 0.5rem', fontSize: '1.4rem' }}>
              {editingRelease ? 'Edit Release' : 'New Android App Release'}
            </h3>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
              Publish your new update to the website and announce it to subscribers.
            </p>

            {formError && (
              <div
                style={{
                  background: '#FFF1F0',
                  border: '1px solid #FFCCC7',
                  color: '#D32F2F',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRelease}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Version Tag *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="v1.0.1"
                    value={version}
                    onChange={(e) => handleVersionChange(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Build Code</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="2"
                    value={versionCode}
                    onChange={(e) => setVersionCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Release Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Shepema v1.0.1 - Bug Fixes & Daily Devotions"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">APK Download URL *</label>
                <input
                  type="url"
                  required
                  className="form-input"
                  placeholder="https://github.com/bJOE2001/shepema-web/releases/download/v1.0.1/Shepema_v1.0.1.apk"
                  value={apkUrl}
                  onChange={(e) => setApkUrl(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Display File Size</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="~138 MB"
                    value={apkSize}
                    onChange={(e) => setApkSize(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Min Android Version</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Android 8.0+"
                    value={minAndroid}
                    onChange={(e) => setMinAndroid(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Release Notes & Changelog (Markdown)</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder={`- ✨ Added offline audio Bible support\n- 🐛 Fixed journal entry timestamp sync\n- 🎨 Aesthetic paper texture polish`}
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', margin: '1.25rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={isLatest}
                    onChange={(e) => setIsLatest(e.target.checked)}
                  />
                  <span><strong>Set as latest active release</strong> (Recommended — updates landing page button)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />
                  <span>Publish release immediately to public website</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={notifySubscribers}
                    onChange={(e) => setNotifySubscribers(e.target.checked)}
                  />
                  <span>Open Email Broadcaster to notify subscribers after saving</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-admin btn-admin-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-admin" disabled={saving}>
                  {saving ? 'Saving...' : 'Save & Publish Release'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
