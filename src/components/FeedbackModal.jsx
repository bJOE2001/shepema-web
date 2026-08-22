import { useState } from 'react';
import { submitFeedback } from '../lib/supabase';
import {
  MessageSquare,
  Bug,
  Lightbulb,
  Heart,
  BookOpen,
  Send,
  CheckCircle2,
  X,
  Star,
  Sparkles,
} from 'lucide-react';

const FEEDBACK_TYPES = [
  { id: 'bug', label: 'Bug Report', icon: Bug, color: '#D32F2F', bg: '#FFF1F0', border: '#FFCCC7' },
  { id: 'feature', label: 'Feature Idea', icon: Lightbulb, color: '#B28228', bg: '#FFF8EC', border: '#EADBBA' },
  { id: 'general', label: 'General Feedback', icon: Heart, color: '#2D612D', bg: '#EAF3EA', border: '#C8E6C9' },
  { id: 'content', label: 'Bible / Content', icon: BookOpen, color: '#C46246', bg: '#FBF0EC', border: '#F2D5CB' },
];

export default function FeedbackModal({ isOpen, onClose, defaultType = 'general' }) {
  const [type, setType] = useState(defaultType);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [appVersion, setAppVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!subject.trim() || !message.trim()) {
      setErrorMsg('Please enter a subject and your feedback message.');
      return;
    }

    try {
      setLoading(true);
      await submitFeedback({
        type,
        subject,
        message,
        name,
        email,
        rating,
        app_version: appVersion || null,
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setErrorMsg(err.message || 'Failed to send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubject('');
    setMessage('');
    setName('');
    setEmail('');
    setRating(5);
    onClose();
  };

  return (
    <div className="admin-modal-overlay" onClick={handleReset}>
      <div
        className="admin-modal"
        style={{
          maxWidth: '560px',
          padding: '2.25rem',
          borderRadius: '24px',
          background: 'var(--card-bg, #FFFFFF)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleReset}
          className="modal-close-btn"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'var(--brand-green-light, #EAF3EA)',
                color: 'var(--brand-green, #3A7D3A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                border: '1px solid #C8E6C9',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-display, Georgia)', fontSize: '1.6rem', margin: '0 0 0.5rem', color: 'var(--ink-primary)' }}>
              Thank You for Your Feedback! 🐑
            </h3>

            <p style={{ color: 'var(--ink-secondary)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '420px', margin: '0 auto 1.75rem' }}>
              Your thoughts and bug reports help us nurture Shepema into a more peaceful, faithful quiet time companion.
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReset}
              style={{ padding: '0.75rem 2rem', borderRadius: '24px' }}
            >
              Close
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'var(--brand-green-light)',
                  color: 'var(--brand-green-dark)',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '16px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                }}
              >
                <Sparkles size={13} />
                <span>Community Voice</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display, Georgia)', fontSize: '1.6rem', margin: '0 0 0.4rem', color: 'var(--ink-primary)' }}>
                Feedback & Bug Reports
              </h2>
              <p style={{ color: 'var(--ink-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Found a glitch, have a feature idea, or want to share your experience? We'd love to hear from you!
              </p>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: '#FFF1F0',
                  border: '1px solid #FFCCC7',
                  color: '#D32F2F',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Type Category Chips */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Select Feedback Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {FEEDBACK_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '12px',
                          border: `1.5px solid ${isSelected ? t.color : 'var(--paper-line)'}`,
                          background: isSelected ? t.bg : 'var(--paper-bg)',
                          color: isSelected ? t.color : 'var(--ink-primary)',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'left',
                        }}
                      >
                        <Icon size={16} color={t.color} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Star Rating */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">How is your experience with Shepema?</label>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: star <= (hoverRating || rating) ? '#D4A84B' : 'var(--paper-line)',
                        transition: 'transform 0.1s ease',
                      }}
                    >
                      <Star size={22} fill={star <= (hoverRating || rating) ? '#D4A84B' : 'none'} />
                    </button>
                  ))}
                  <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginLeft: '0.5rem' }}>
                    {rating === 5 ? 'Loved it! 🐑' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Needs work' : 'Poor'}
                  </span>
                </div>
              </div>

              {/* Subject */}
              <div className="form-group">
                <label className="form-label">Title / Summary *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder={
                    type === 'bug'
                      ? 'e.g., Font slider resets after restarting app'
                      : type === 'feature'
                      ? 'e.g., Add Audio Bible narration or Tagalog translation'
                      : 'e.g., Loving the quiet time framework!'
                  }
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Description Message */}
              <div className="form-group">
                <label className="form-label">Details / Description *</label>
                <textarea
                  required
                  rows={4}
                  className="form-textarea"
                  placeholder={
                    type === 'bug'
                      ? 'Please describe what happened, your phone model, or steps to reproduce the issue...'
                      : 'Share your thoughts, suggestions, or words of encouragement...'
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Optional Name & Email row */}
              <div className="form-row" style={{ marginBottom: '1.5rem' }}>
                <div>
                  <label className="form-label">Your Name (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. John"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Email (Optional, for replies)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-admin btn-admin-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-admin"
                  disabled={loading}
                  style={{ gap: '0.4rem', padding: '0 1.5rem' }}
                >
                  {loading ? 'Submitting...' : 'Send Feedback'}
                  <Send size={15} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
