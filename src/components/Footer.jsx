export default function Footer({ onOpenChangelog }) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div>
            <div className="footer-brand">
              <img src="/images/app-icon.jpg" alt="Shepema" />
              <span>Shepema</span>
            </div>
            <p className="footer-tagline">
              Guided by God's Word.<br />
              Your daily devotional buddy.
            </p>
          </div>

          <div className="footer-links">
            <span className="footer-links-title">Quick Links</span>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#install-guide">Install Guide</a>
            <a href="#about">About</a>
            <a href="#download">Download</a>
            {onOpenChangelog && (
              <a
                href="#changelog"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenChangelog();
                }}
              >
                Release Notes
              </a>
            )}
            <a href="#subscribe">Get Updates</a>
          </div>

          <div className="footer-verse">
            <blockquote>
              "Thy word is a lamp unto my feet, and a light unto my path."
              <cite>— Psalm 119:105 (KJV)</cite>
            </blockquote>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copyright">
            &copy; {year} Shepema. All rights reserved.
          </span>
          <span className="footer-made-with">
            Made with <span>❤️</span> and faith
          </span>
        </div>
      </div>
    </footer>
  );
}
