import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function About() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <section className="about section" id="about">
      <div className="container">
        <div ref={ref} className={`about-layout fade-in-section ${isVisible ? 'is-visible' : ''}`}>
          <div className="about-visual">
            <div className="about-mascot-scene">
              {/* Custom Arch Backdrop with Golden Halo & Ray Glow */}
              <div className="about-backdrop-arch">
                <div className="about-backdrop-glow"></div>
                <div className="about-backdrop-sun"></div>
                <div className="about-backdrop-ring"></div>
              </div>

              {/* Floating aesthetic badge */}
              <div className="about-floating-pill">
                <span className="pill-icon">🐑</span>
                <span className="pill-text">Devotional Buddy</span>
              </div>

              {/* Ambient sparkles */}
              <div className="about-sparkle about-sparkle--1">✦</div>
              <div className="about-sparkle about-sparkle--2">✨</div>
              <div className="about-sparkle about-sparkle--3">✦</div>

              {/* Transparent Mascot Holding Bible */}
              <img
                src="/images/mascot-holding-bible-transparent.png"
                alt="Shepema mascot holding the Holy Bible"
                className="about-mascot-img"
                loading="lazy"
              />
            </div>
          </div>

          <div className="about-content">
            <h2>About Shepema</h2>
            <p className="about-highlight">
              "Your faithful devotional buddy — keeping you company in God's Word every single day."
            </p>
            <p className="about-text">
              Shepema (from <strong>"Sheep"</strong> + <strong>"Rhema"</strong> — God's living Word) is designed 
              to be the warm, encouraging <strong>devotional buddy</strong> for every believer. Whether you are doing morning 
              quiet time, reflecting on a verse during lunch, or unwinding at night with prayer, Shepema is right there with you.
            </p>
            <p className="about-text">
              Built with a classic paper notebook feel and powered 100% offline, your devotions and reflections stay 
              private, peaceful, and always accessible on your journey with God.
            </p>

            <div className="about-badges">
              <div className="about-badge">
                <span className="about-badge-icon">📴</span>
                <span>100% Offline</span>
              </div>
              <div className="about-badge">
                <span className="about-badge-icon">🚫</span>
                <span>No Ads Ever</span>
              </div>
              <div className="about-badge">
                <span className="about-badge-icon">🔒</span>
                <span>Your Data Stays Private</span>
              </div>
              <div className="about-badge">
                <span className="about-badge-icon">💚</span>
                <span>Free Forever</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
