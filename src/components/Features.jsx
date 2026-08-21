import { useScrollAnimation } from '../hooks/useScrollAnimation';

const features = [
  {
    icon: '📖',
    title: 'Multi-Version Scripture Reader',
    description: 'Download multiple Bible translations to read completely offline. Enjoy fast book, chapter, and verse navigation, highlighting, and bookmarks.',
    color: 'rhema',
  },
  {
    icon: '✍️',
    title: 'R.R.M.A. Journaling',
    description: 'Guided devotional reflection using the Rhema, Reflection, Motivation, Application method. Journal your walk with God.',
    color: 'reflection',
  },
  {
    icon: '📅',
    title: 'Daily Dashboard',
    description: 'Track your devotional streaks, view today\'s action steps, and stay consistent in your spiritual journey.',
    color: 'motivation',
  },
  {
    icon: '🎨',
    title: 'Shareable Cards',
    description: 'Create beautiful, aesthetic quote and devotional image cards. Share your favorite verses with friends and family.',
    color: 'application',
  },
  {
    icon: '🔒',
    title: 'Privacy Protection',
    description: 'Keep your journal secure with biometric authentication (Face ID / Fingerprint) and PIN lock for complete privacy.',
    color: 'green',
  },
  {
    icon: '📜',
    title: 'Classic Notebook Theme',
    description: 'Rich serif typography with warm paper textures, ruled lines, and elegant design. Like writing in a real leather journal.',
    color: 'gold',
  },
];

export default function Features() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <section className="features section" id="features">
      <div className="container">
        <h2 className="section-title">Everything You Need</h2>
        <p className="section-subtitle">
          A complete devotional companion designed with beauty and purpose.
          Every feature crafted to deepen your walk with God.
        </p>
        <div
          ref={ref}
          className={`features-grid stagger-children ${isVisible ? 'is-visible' : ''}`}
        >
          {features.map((feature, i) => (
            <div key={i} className={`feature-card feature-card--${feature.color}`}>
              <span className="feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
