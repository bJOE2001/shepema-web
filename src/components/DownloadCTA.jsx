import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function DownloadCTA() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <section className="download-cta section" id="download">
      <div className="container" ref={ref}>
        <div className={`fade-in-section ${isVisible ? 'is-visible' : ''}`}>
          <img
            src="/images/app-icon.jpg"
            alt="Shephema app icon"
            className="download-cta-icon"
          />

          <h2 className="section-title">Download Shephema</h2>
          <p className="download-cta-subtitle">
            Start your devotional journey today. Beautiful, free, and
            completely offline — your personal Scripture companion awaits.
          </p>

          <a
            href="https://github.com/bJOE2001/shepema-web/releases/download/v1.0.1/Shephema-v1.0.1.apk"
            className="download-cta-button"
            target="_blank"
            rel="noopener noreferrer"
          >
            ⬇ Download for Android
          </a>

          <div className="download-cta-info">
            <span>📦 v1.0.1</span>
            <span>📱 Android 8.0+</span>
            <span>💾 ~108 MB (Offline Bible Included)</span>
          </div>

          <div className="download-cta-features">
            <span className="download-cta-feature">✨ Free Forever</span>
            <span className="download-cta-feature">🚫 No Ads</span>
            <span className="download-cta-feature">📴 100% Offline</span>
            <span className="download-cta-feature">🔒 Private & Secure</span>
          </div>
        </div>
      </div>
    </section>
  );
}
