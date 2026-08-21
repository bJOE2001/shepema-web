export default function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-tagline">
            <span>🐑</span> Your Devotional Buddy
          </div>
          <h1 className="hero-title">
            Guided by <em>God's Word</em>
          </h1>
          <p className="hero-description">
            Meet <strong>Shepema</strong> — your friendly devotional buddy. An aesthetic
            journaling and Scripture reader app crafted to guide your quiet time with
            the R.R.M.A. method, complete KJV Bible, and daily streak encouragement.
          </p>
          <div className="hero-actions">
            <a
              href="https://github.com/bJOE2001/shepema-web/releases/download/v1.0.0/Shepema-v1.0.0.apk"
              className="btn btn-primary btn-large"
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇ Download APK
            </a>
            <a
              href="#install-guide"
              className="btn btn-secondary btn-large"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('install-guide')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              📖 Install Guide
            </a>
            <span className="hero-version">v1.0.0 • Android</span>
          </div>
          <div className="hero-badges">
            <span className="badge">✨ 100% Free</span>
            <span className="badge">🚫 No Ads</span>
            <span className="badge">📴 Works Offline</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-mascot-scene">
            {/* Custom decorative arched background & halo aura */}
            <div className="hero-backdrop-arch">
              <div className="hero-backdrop-glow"></div>
              <div className="hero-backdrop-sun"></div>
              <div className="hero-backdrop-ring"></div>
            </div>

            {/* Floating ambient devotional elements */}
            <div className="hero-sparkle hero-sparkle--1">✦</div>
            <div className="hero-sparkle hero-sparkle--2">✨</div>
            <div className="hero-sparkle hero-sparkle--3">✦</div>

            <div className="hero-floating-pill">
              <span className="pill-icon">☕</span>
              <span className="pill-text">Daily Quiet Time</span>
            </div>

            {/* The transparent cozy reading mascot */}
            <img
              src="/images/mascot-cozy-reading-transparent.png"
              alt="Shepema — your devotional buddy cozy reading the Holy Bible"
              className="hero-mascot-cozy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
