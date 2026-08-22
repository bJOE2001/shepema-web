import { useState, useEffect } from 'react';
import {
  getAllReleases,
  getSubscribers,
  sendReleaseNotification,
  isSupabaseConfigured,
} from '../../lib/supabase';
import {
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  Eye,
  Settings,
  Users,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function EmailBroadcaster({ selectedRelease: initialRelease }) {
  const [releases, setReleases] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState(initialRelease?.id || '');

  // Composer fields
  const [version, setVersion] = useState(initialRelease?.version || 'v1.0.1');
  const [title, setTitle] = useState(initialRelease?.title || 'New Shepema Update Ready!');
  const [subject, setSubject] = useState(`🐑 Shepema Update: ${initialRelease?.version || 'v1.0.1'} is now available!`);
  const [customMessage, setCustomMessage] = useState(
    'A brand new update is ready for your quiet time journey! We’ve added improvements to support your daily walk with the Word.'
  );
  const [releaseNotes, setReleaseNotes] = useState(
    initialRelease?.release_notes || '- ✨ Performance enhancements\n- 📖 Offline Bible improvements\n- 🎨 Aesthetic paper texture polish'
  );
  const [apkUrl, setApkUrl] = useState(initialRelease?.apk_url || 'https://shepema.com');

  // Test & Sending State
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [resendKey, setResendKey] = useState(localStorage.getItem('shepema_resend_key') || '');
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const rels = await getAllReleases(true);
        setReleases(rels);
        const subs = await getSubscribers();
        setSubscribers(subs);

        if (!selectedReleaseId && rels.length > 0) {
          const first = rels[0];
          setSelectedReleaseId(first.id);
          setVersion(first.version);
          setTitle(first.title || `Shepema ${first.version}`);
          setSubject(`🐑 Shepema Update: ${first.version} is now available!`);
          setReleaseNotes(first.release_notes || '');
          setApkUrl(first.apk_url || 'https://shepema.com');
        }
      } catch (err) {
        console.error('Failed to load broadcast data:', err);
      }
    }
    loadData();
  }, []);

  const handleReleaseSelect = (relId) => {
    setSelectedReleaseId(relId);
    const rel = releases.find((r) => r.id === relId);
    if (rel) {
      setVersion(rel.version);
      setTitle(rel.title || `Shepema ${rel.version}`);
      setSubject(`🐑 Shepema Update: ${rel.version} is now available!`);
      setReleaseNotes(rel.release_notes || '');
      setApkUrl(rel.apk_url || 'https://shepema.com');
    }
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('shepema_resend_key', resendKey.trim());
    setStatusMsg({ type: 'success', text: 'Resend API Key saved locally!' });
    setTimeout(() => setStatusMsg(null), 3000);
    setShowConfig(false);
  };

  const handleSendEmail = async (isTest = false) => {
    setStatusMsg(null);

    if (isTest && !testEmail.trim()) {
      setStatusMsg({ type: 'error', text: 'Please provide a test recipient email address.' });
      return;
    }

    try {
      setSending(true);
      const result = await sendReleaseNotification({
        releaseId: selectedReleaseId || undefined,
        version,
        title,
        releaseNotes,
        apkUrl,
        customSubject: subject,
        customMessage,
        testEmailOnly: isTest ? testEmail.trim() : undefined,
      });

      const count = result?.sentCount ?? (isTest ? 1 : activeSubscribers.length);

      setStatusMsg({
        type: 'success',
        text: isTest
          ? `🎉 Test email sent successfully to ${testEmail} via Gmail SMTP!`
          : `🎉 Success! Email update for ${version} was successfully sent to ${count} subscriber(s)!`,
      });

      // Scroll to notification
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to send email:', err);
      setStatusMsg({
        type: 'error',
        text: `⚠️ Error sending email: ${err.message || 'Please check your Gmail SMTP credentials or Edge Function.'}`,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSending(false);
    }
  };

  const activeSubscribers = subscribers.filter((s) => s.is_active);

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">
              <Mail size={22} color="var(--brand-green)" />
              Send Email Updates
            </h2>
            <p className="admin-card-desc">
              Compose and send devotional-styled release announcements to all your subscribers via Gmail SMTP.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.85rem',
                background: 'var(--brand-green-light)',
                color: 'var(--brand-green-dark)',
                padding: '0.35rem 0.75rem',
                borderRadius: '16px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Users size={14} />
              {activeSubscribers.length} Subscribers
            </span>

            <button
              className="btn-admin btn-admin-secondary"
              onClick={() => setShowConfig(!showConfig)}
              title="Configure Resend API Key"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {showConfig && (
          <div
            style={{
              background: 'var(--section-alt-bg)',
              border: '1px solid var(--paper-line)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Direct Resend API Key (Optional Client Fallback)</h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--ink-secondary)', margin: '0 0 0.75rem' }}>
              If you haven't deployed the Supabase Edge function yet, you can provide your free Resend API key directly:
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px' }}>
              <input
                type="password"
                className="form-input"
                placeholder="re_123456789..."
                value={resendKey}
                onChange={(e) => setResendKey(e.target.value)}
              />
              <button className="btn-admin" onClick={handleSaveApiKey}>
                Save Key
              </button>
            </div>
          </div>
        )}

        {statusMsg && (
          <div
            style={{
              background: statusMsg.type === 'success' ? '#EAF5EA' : '#FFF1F0',
              border: `1.5px solid ${statusMsg.type === 'success' ? '#A3D9A5' : '#FFCCC7'}`,
              color: statusMsg.type === 'success' ? '#1B5E20' : '#C62828',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              fontSize: '0.95rem',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {statusMsg.type === 'success' ? (
                <CheckCircle size={20} color="#2E7D32" style={{ flexShrink: 0 }} />
              ) : (
                <AlertCircle size={20} color="#D32F2F" style={{ flexShrink: 0 }} />
              )}
              <span>{statusMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMsg(null)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                opacity: 0.7,
                fontSize: '1.2rem',
                lineHeight: 1,
                padding: '0 4px',
              }}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Left: Email Composer */}
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--brand-gold)" /> Email Composition
            </h3>

            {releases.length > 0 && (
              <div className="form-group">
                <label className="form-label">Auto-populate from Release</label>
                <select
                  className="form-select"
                  value={selectedReleaseId}
                  onChange={(e) => handleReleaseSelect(e.target.value)}
                >
                  {releases.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.version} - {r.title || 'Untitled'} ({new Date(r.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Subject Line</label>
              <input
                type="text"
                className="form-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Update Title</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Greeting & Message Body</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Changelog Highlights (What's New)</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Download APK Link</label>
              <input
                type="url"
                className="form-input"
                value={apkUrl}
                onChange={(e) => setApkUrl(e.target.value)}
              />
            </div>

            {/* Test Send Area */}
            <div
              style={{
                background: 'var(--paper-bg)',
                border: '1px solid var(--paper-line)',
                borderRadius: '12px',
                padding: '1rem',
                margin: '1.5rem 0',
              }}
            >
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Send Test Email to Yourself First</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your-email@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-admin btn-admin-secondary"
                  onClick={() => handleSendEmail(true)}
                  disabled={sending}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Send Test
                </button>
              </div>
            </div>

            {/* Mass Send Button */}
            <button
              className="btn-admin"
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem' }}
              disabled={sending}
              onClick={() => setShowConfirmModal(true)}
            >
              <Send size={18} />
              {sending
                ? 'Sending Emails...'
                : `Send Update to All Subscribers (${activeSubscribers.length})`}
            </button>
          </div>

          {/* Right: Live Preview */}
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} color="var(--ink-secondary)" /> Live Subscriber Email Preview
            </h3>

            <div className="email-preview-container" style={{ background: '#EAE4DC', padding: '1.5rem', borderRadius: '16px' }}>
              <div className="email-preview-card" style={{ maxWidth: '560px', borderRadius: '16px', border: '1px solid #DCD4C8', boxShadow: '0 8px 30px rgba(44, 37, 32, 0.12)', background: '#FFFFFF', overflow: 'hidden' }}>
                
                {/* Decorative Top Gold Ribbon */}
                <div style={{ height: '5px', background: 'linear-gradient(90deg, #3A7D3A, #D4A84B, #C46246)' }} />

                {/* Email Header */}
                <div style={{ background: '#2D612D', color: '#FFFFFF', padding: '28px 24px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.15)', padding: '6px 16px', borderRadius: '24px', marginBottom: '10px' }}>
                    <img
                      src="/images/app-icon.jpg"
                      alt="Shepema App Icon"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '7px',
                        border: '1.5px solid rgba(255, 255, 255, 0.4)',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.05em', color: '#FFFFFF' }}>SHEPEMA</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#EAF3EA', letterSpacing: '0.03em', fontWeight: '500' }}>
                    Guided by God's Word • Devotional Companion
                  </p>
                </div>

                {/* Email Body Content */}
                <div style={{ padding: '28px 24px', backgroundColor: '#FFFFFF', color: '#2C2520', fontFamily: 'Georgia, serif' }}>
                  
                  {/* Version Badge */}
                  <div style={{ marginBottom: '14px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: '#FFF8EC',
                        color: '#B28228',
                        border: '1px solid #EADBBA',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        letterSpacing: '0.04em',
                      }}
                    >
                      ✨ {version} RELEASED
                    </span>
                  </div>

                  {/* Title */}
                  <h2 style={{ margin: '0 0 14px', fontSize: '22px', color: '#2C2520', fontFamily: 'Georgia, serif', lineHeight: '1.3' }}>
                    {title}
                  </h2>

                  {/* Custom Message */}
                  <p style={{ fontSize: '15px', lineHeight: '1.65', color: '#4A3E34', margin: '0 0 20px' }}>
                    {customMessage}
                  </p>

                  {/* Devotional Verse Callout Card */}
                  <div
                    style={{
                      backgroundColor: '#FAF7F2',
                      borderLeft: '4px solid #C46246',
                      padding: '14px 18px',
                      borderRadius: '0 10px 10px 0',
                      marginBottom: '22px',
                      boxShadow: '0 1px 3px rgba(44, 37, 32, 0.04)',
                    }}
                  >
                    <p style={{ margin: '0 0 4px', fontStyle: 'italic', color: '#4A3E34', fontSize: '14px', lineHeight: '1.5' }}>
                      “Thy word is a lamp unto my feet, and a light unto my path.”
                    </p>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#C46246' }}>
                      — Psalm 119:105
                    </span>
                  </div>

                  {/* What's New Box */}
                  <div
                    style={{
                      background: '#FAF8F5',
                      border: '1px solid #EAE2D5',
                      borderRadius: '12px',
                      padding: '18px 20px',
                      marginBottom: '26px',
                    }}
                  >
                    <h4 style={{ margin: '0 0 12px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#2D612D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✦ What's New in this Version:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {releaseNotes
                        .split('\n')
                        .map((l) => l.trim().replace(/^[*-]\s*/, ''))
                        .filter(Boolean)
                        .map((line, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                              fontSize: '14px',
                              lineHeight: '1.5',
                              color: '#3D342C',
                            }}
                          >
                            <span style={{ color: '#3A7D3A', fontSize: '14px', marginTop: '1px' }}>•</span>
                            <span>{line}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div style={{ textAlign: 'center', margin: '26px 0 16px' }}>
                    <a
                      href={apkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: '#2D612D',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        padding: '14px 34px',
                        borderRadius: '28px',
                        fontWeight: 'bold',
                        fontSize: '15px',
                        display: 'inline-block',
                        boxShadow: '0 4px 14px rgba(45, 97, 45, 0.3)',
                        letterSpacing: '0.02em',
                      }}
                    >
                      ⬇ Download APK ({version})
                    </a>
                  </div>

                  <p style={{ textAlign: 'center', margin: '8px 0 0', fontSize: '12px', color: '#8A7D71' }}>
                    Tap button to download update file directly to your Android device
                  </p>
                </div>

                {/* Email Footer */}
                <div style={{ background: '#FAF7F2', borderTop: '1px solid #E8E0D4', padding: '18px 20px', textAlign: 'center', fontSize: '12px', color: '#8A7D71', lineHeight: '1.6' }}>
                  <p style={{ margin: '0 0 4px' }}>
                    Made with ❤️ and faith for your daily quiet time.
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#A3968A' }}>
                    You received this email because you subscribed for Shepema updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="admin-modal-overlay" onClick={() => !sending && setShowConfirmModal(false)}>
          <div
            className="admin-modal"
            style={{ maxWidth: '480px', padding: '2.25rem', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                background: 'var(--brand-green-light)',
                color: 'var(--brand-green)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                border: '1px solid #D4E8D4',
              }}
            >
              <Send size={26} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', margin: '0 0 0.5rem', fontSize: '1.5rem', color: 'var(--ink-primary)' }}>
              Ready to Send Update?
            </h3>

            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem', lineHeight: '1.5', margin: '0 0 1.5rem' }}>
              You are about to broadcast the <strong>{version}</strong> update email to all <strong>{activeSubscribers.length}</strong> active subscriber(s).
            </p>

            <div
              style={{
                background: 'var(--section-alt-bg)',
                border: '1px solid var(--paper-line)',
                borderRadius: '12px',
                padding: '1rem',
                textAlign: 'left',
                fontSize: '0.85rem',
                color: 'var(--ink-secondary)',
                marginBottom: '1.75rem',
              }}
            >
              <div style={{ marginBottom: '0.4rem' }}>
                <strong style={{ color: 'var(--ink-primary)' }}>Subject:</strong> {subject}
              </div>
              <div>
                <strong style={{ color: 'var(--ink-primary)' }}>Recipients:</strong> {activeSubscribers.length} subscriber(s) via Gmail SMTP
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-admin btn-admin-secondary"
                style={{ flex: 1, justifyContent: 'center', padding: '0.75rem' }}
                onClick={() => setShowConfirmModal(false)}
                disabled={sending}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-admin"
                style={{ flex: 1.3, justifyContent: 'center', padding: '0.75rem' }}
                disabled={sending}
                onClick={async () => {
                  setShowConfirmModal(false);
                  await handleSendEmail(false);
                }}
              >
                {sending ? 'Sending...' : `Send Update to ${activeSubscribers.length} Subscribers`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
