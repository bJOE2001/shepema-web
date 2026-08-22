import { useState, useEffect } from 'react';
import { getAllReleases, recordDownload } from '../lib/supabase';
import { Download, Sparkles, Calendar, Package } from 'lucide-react';

export default function ReleaseHistoryModal({ isOpen, onClose }) {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAllReleases(false)
        .then((data) => setReleases(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          &times;
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--brand-green-light)',
              color: 'var(--brand-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', margin: 0, fontSize: '1.4rem' }}>
              Release Changelog & History
            </h2>
            <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: '0.85rem' }}>
              Browse all updates, improvements, and previous APK builds.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-muted)' }}>
              Loading changelog...
            </p>
          ) : releases.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--ink-secondary)' }}>
              No releases found.
            </p>
          ) : (
            releases.map((rel) => (
              <div
                key={rel.id}
                style={{
                  background: 'var(--paper-bg)',
                  border: '1px solid var(--paper-line)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className="release-version-tag" style={{ fontSize: '0.95rem' }}>{rel.version}</span>
                      {rel.is_latest && (
                        <span className="pill-status latest" style={{ fontSize: '0.75rem' }}>★ Latest</span>
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', color: 'var(--ink-primary)' }}>
                      {rel.title || `Shepema ${rel.version}`}
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--ink-muted)', fontSize: '0.8rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={13} /> {new Date(rel.created_at).toLocaleDateString()}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Package size={13} /> {rel.apk_size_formatted || '~108 MB'}
                      </span>
                    </div>
                  </div>

                  <a
                    href={rel.apk_url}
                    className="btn btn-primary"
                    style={{
                      padding: '0.45rem 1rem',
                      fontSize: '0.825rem',
                      borderRadius: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      textDecoration: 'none',
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => recordDownload(rel.id)}
                  >
                    <Download size={14} /> Download APK
                  </a>
                </div>

                {rel.release_notes && (
                  <div
                    style={{
                      marginTop: '1rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px dashed var(--paper-line)',
                      fontSize: '0.875rem',
                      lineHeight: '1.6',
                      color: 'var(--ink-secondary)',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {rel.release_notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
