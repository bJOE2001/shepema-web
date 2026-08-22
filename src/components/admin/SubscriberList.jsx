import { useState, useEffect } from 'react';
import {
  getSubscribers,
  subscribeNewsletter,
  deleteSubscriber,
  toggleSubscriber,
} from '../../lib/supabase';
import {
  Users,
  UserPlus,
  Trash2,
  Download,
  Search,
  CheckCircle,
  RefreshCw,
  Mail,
} from 'lucide-react';

export default function SubscriberList() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add new subscriber form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const fetchSubs = async () => {
    try {
      setLoading(true);
      const data = await getSubscribers();
      setSubscribers(data);
    } catch (err) {
      console.error('Failed to load subscribers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      setAddLoading(true);
      await subscribeNewsletter(newEmail.trim(), newName.trim());
      setNotice({ type: 'success', text: `Subscriber ${newEmail} added!` });
      setTimeout(() => setNotice(null), 4000);
      setNewEmail('');
      setNewName('');
      setShowAddForm(false);
      await fetchSubs();
    } catch (err) {
      console.error('Error adding subscriber:', err);
      setNotice({ type: 'error', text: err.message || 'Failed to add subscriber.' });
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (sub) => {
    if (!window.confirm(`Delete subscriber ${sub.email}?`)) return;
    try {
      await deleteSubscriber(sub.id);
      fetchSubs();
    } catch (err) {
      console.error('Error deleting subscriber:', err);
    }
  };

  const handleToggle = async (sub) => {
    try {
      await toggleSubscriber(sub.id, !sub.is_active);
      fetchSubs();
    } catch (err) {
      console.error('Error toggling subscriber:', err);
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) return;
    const headers = 'Email,Name,Subscribed At,Status\n';
    const rows = subscribers
      .map(
        (s) =>
          `"${s.email}","${s.name || ''}","${new Date(s.subscribed_at).toISOString()}","${s.is_active ? 'Active' : 'Inactive'}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shepema_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const filteredSubs = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              <Users size={22} color="var(--brand-green)" />
              Newsletter & App Update Subscribers
            </h2>
            <p className="admin-card-desc">
              Manage users who signed up to receive update alerts and devotional announcements.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-admin btn-admin-secondary" onClick={fetchSubs} title="Refresh">
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
            <button
              className="btn-admin btn-admin-secondary"
              onClick={handleExportCSV}
              disabled={subscribers.length === 0}
            >
              <Download size={16} /> Export CSV
            </button>
            <button className="btn-admin" onClick={() => setShowAddForm(!showAddForm)}>
              <UserPlus size={16} /> Add Subscriber
            </button>
          </div>
        </div>

        {notice && (
          <div
            style={{
              background: notice.type === 'success' ? '#E8F5E9' : '#FFF1F0',
              border: `1px solid ${notice.type === 'success' ? '#C8E6C9' : '#FFCCC7'}`,
              color: notice.type === 'success' ? '#2E7D32' : '#D32F2F',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
            }}
          >
            {notice.text}
          </div>
        )}

        {showAddForm && (
          <form
            onSubmit={handleAddSubscriber}
            style={{
              background: 'var(--section-alt-bg)',
              border: '1px solid var(--paper-line)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <h4 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Manually Add Subscriber</h4>
            <div className="form-row">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Name (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Friend in Christ"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn-admin btn-admin-secondary"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-admin" disabled={addLoading}>
                {addLoading ? 'Saving...' : 'Add to Subscriber List'}
              </button>
            </div>
          </form>
        )}

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search subscribers by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--ink-muted)',
            }}
          />
        </div>

        {/* Subscribers Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-muted)' }}>
            <RefreshCw size={28} className="spin" style={{ margin: '0 auto 0.75rem' }} />
            <p>Loading subscriber list...</p>
          </div>
        ) : filteredSubs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink-secondary)' }}>
            <Mail size={40} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
            <p>No subscribers found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--paper-line)', color: 'var(--ink-secondary)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Subscribed On</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--paper-line)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{s.email}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--ink-secondary)' }}>{s.name || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
                      {new Date(s.subscribed_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`pill-status ${s.is_active ? 'published' : 'draft'}`}>
                        {s.is_active ? 'Active' : 'Unsubscribed'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <button
                        className="btn-admin btn-admin-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', marginRight: '0.35rem' }}
                        onClick={() => handleToggle(s)}
                      >
                        {s.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="btn-admin btn-admin-danger"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => handleDelete(s)}
                        title="Delete subscriber"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
