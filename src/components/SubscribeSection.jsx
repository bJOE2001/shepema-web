import { useState } from 'react';
import { subscribeNewsletter } from '../lib/supabase';
import { Mail, CheckCircle2, Sparkles, Send, Bell, ShieldCheck } from 'lucide-react';

export default function SubscribeSection() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      await subscribeNewsletter(email.trim());
      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('Subscription error:', err);
      setErrorMsg(err.message || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="subscribe-section" id="subscribe">
      <div className="container">
        <div className="subscribe-card">
          <div className="subscribe-badge">
            <Sparkles size={14} />
            <span>Stay in the Loop</span>
          </div>

          <h2 className="subscribe-title">
            Get Notified of New App Updates
          </h2>

          <p className="subscribe-subtitle">
            Be the first to know when new offline Bible translations, audio features, and devotional journaling updates are released!
          </p>

          {success ? (
            <div className="subscribe-success-card">
              <CheckCircle2 size={24} className="subscribe-success-icon" />
              <div>
                <h4>You're all set! 🐑</h4>
                <p>
                  We've saved your email. You'll receive a warm update whenever a new Shepema version is ready for download.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="subscribe-form">
              <div className="subscribe-form-row">
                <div className="subscribe-input-wrapper">
                  <Mail size={18} className="subscribe-input-icon" />
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    className="subscribe-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="subscribe-btn"
                  disabled={loading}
                >
                  {loading ? 'Subscribing...' : 'Notify Me'}
                  <Send size={16} />
                </button>
              </div>

              {errorMsg && (
                <p style={{ color: '#D32F2F', fontSize: '0.85rem', margin: '0.5rem 0 0', textAlign: 'center' }}>
                  {errorMsg}
                </p>
              )}

              <div className="subscribe-privacy-note">
                <ShieldCheck size={14} />
                <span>No spam, no ads. Unsubscribe anytime with 1 click.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
