import { useScrollAnimation } from '../hooks/useScrollAnimation';

const installSteps = [
  {
    step: '01',
    icon: '📥',
    title: 'Download the APK',
    description:
      'Tap the Download APK button on this website to get the latest Shepema-v1.0.0.apk package directly to your Android device.',
    tip: 'If Chrome warns "File might be harmful", tap "Download anyway".',
    badge: 'Step 1',
    theme: 'rhema',
  },
  {
    step: '02',
    icon: '📂',
    title: 'Open Downloaded File',
    description:
      'Swipe down your notification bar and tap on the completed download notification, or locate the APK in your Files > Downloads folder.',
    tip: 'Tap the file once to initiate the Android package installer.',
    badge: 'Step 2',
    theme: 'reflection',
  },
  {
    step: '03',
    icon: '⚙️',
    title: 'Allow Unknown Apps',
    description:
      'If Android shows an installation block, tap Settings and turn ON "Allow from this source" for your browser or file manager.',
    tip: 'This is a standard one-time Android security prompt for direct APKs.',
    badge: 'Step 3',
    theme: 'motivation',
  },
  {
    step: '04',
    icon: '✨',
    title: 'Install & Launch',
    description:
      'Press "Install" and wait a few seconds. Once finished, tap "Open" to start your peaceful daily quiet time with Shepema!',
    tip: 'Ready to use offline anytime, anywhere with no ads.',
    badge: 'Step 4',
    theme: 'application',
  },
];

export default function InstallGuide() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <section className="install-guide section" id="install-guide">
      <div className="container">
        <h2 className="section-title">How to Install Shepema</h2>
        <p className="section-subtitle">
          Getting started is simple and takes less than a minute. Follow these 4 easy steps to install the Android APK on your phone or tablet.
        </p>

        <div
          ref={ref}
          className={`install-guide-grid fade-in-section ${
            isVisible ? 'is-visible' : ''
          }`}
        >
          {installSteps.map((item) => (
            <div
              key={item.step}
              className={`install-card install-card--${item.theme}`}
            >
              <div className="install-card-header">
                <div className="install-card-number">{item.step}</div>
                <span className="install-card-icon">{item.icon}</span>
              </div>
              <span className="install-card-badge">{item.badge}</span>
              <h3 className="install-card-title">{item.title}</h3>
              <p className="install-card-desc">{item.description}</p>
              <div className="install-card-tip">
                <span className="tip-icon">💡</span>
                <span>{item.tip}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Troubleshooting & Security Callout */}
        <div className="install-troubleshoot-box">
          <div className="troubleshoot-header">
            <span className="troubleshoot-icon">🛡️</span>
            <div>
              <h3>Common Android Prompts & Tips</h3>
              <p>Everything you need to know about installing direct APKs safely.</p>
            </div>
          </div>

          <div className="troubleshoot-grid">
            <div className="troubleshoot-item">
              <h4>🔔 Google Play Protect warning?</h4>
              <p>
                If Play Protect displays <em>"Unrecognized app"</em>, simply tap{' '}
                <strong>"More details"</strong> and then select{' '}
                <strong>"Install anyway"</strong>. Shepema is 100% clean and contains no telemetry or ads.
              </p>
            </div>

            <div className="troubleshoot-item">
              <h4>📦 File size & Offline Bible</h4>
              <p>
                The download size (~108 MB) includes the complete, full King James Version (KJV) Bible bundled offline, so you never need an active internet connection to read Scripture.
              </p>
            </div>

            <div className="troubleshoot-item">
              <h4>📱 System Requirements</h4>
              <p>
                Supports Android 8.0 (Oreo) and above. Works smoothly on both smartphones and tablets.
              </p>
            </div>

            <div className="troubleshoot-item">
              <h4>🔄 How to Update in Future</h4>
              <p>
                When a new version is released, simply download and install the new APK over your existing installation. Your journals, bookmarks, and streaks are safely preserved!
              </p>
            </div>
          </div>

          <div className="install-cta-banner">
            <div>
              <p className="banner-title">Ready to install Shepema v1.0.0?</p>
              <p className="banner-subtitle">Download the APK directly to your Android device.</p>
            </div>
            <a
              href="https://github.com/bJOE2001/shepema-web/releases/download/v1.0.0/Shepema-v1.0.0.apk"
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              ⬇ Download v1.0.0 APK
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
