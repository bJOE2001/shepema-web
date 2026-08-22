import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useLatestRelease } from '../hooks/useLatestRelease';

export default function DownloadCTA({ onOpenChangelog }) {
  const [ref, isVisible] = useScrollAnimation();
  const { apkUrl, version, fileSize, handleDownloadClick } = useLatestRelease();

  return (
    <section className="download-cta section" id="download">
      <div className="container" ref={ref}>
        <div className={`fade-in-section ${isVisible ? 'is-visible' : ''}`}>
          <img
            src="/images/app-icon.jpg"
            alt="Shepema app icon"
            className="download-cta-icon"
          />

          <h2 className="section-title">Download Shepema</h2>
          <p className="download-cta-subtitle">
            Start your devotional journey today. Beautiful, free, and
            completely offline — your personal Scripture companion awaits.
          </p>

          <div className="download-cta-actions">
            <a
              href={apkUrl}
              className="download-cta-button"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDownloadClick}
            >
              ⬇ Download for Android ({version})
            </a>
            <a
              href="#install-guide"
              className="download-cta-guide-btn"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('install-guide')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              📖 View Installation Guide
            </a>
            {onOpenChangelog && (
              <button
                className="download-cta-guide-btn"
                onClick={onOpenChangelog}
                style={{ cursor: 'pointer' }}
              >
                ✨ What's New
              </button>
            )}
          </div>

          <div className="download-cta-info">
            <span>📦 {version}</span>
            <span>📱 Android 8.0+</span>
            <span>💾 {fileSize} (Offline Bibles Available)</span>
          </div>

          <div className="download-cta-features">
            <span className="download-cta-feature">✨ Free</span>
            <span className="download-cta-feature">🚫 No Ads</span>
            <span className="download-cta-feature">📴 100% Offline</span>
            <span className="download-cta-feature">🔒 Private & Secure</span>
          </div>
        </div>
      </div>
    </section>
  );
}
