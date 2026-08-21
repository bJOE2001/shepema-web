import { useScrollAnimation } from '../hooks/useScrollAnimation';

const steps = [
  {
    key: 'rhema',
    letter: 'R',
    title: 'Rhema',
    label: 'Step 1 — Receive',
    description: 'Receive a word from Scripture. Read and select a Bible verse that speaks to your heart today.',
  },
  {
    key: 'reflection',
    letter: 'R',
    title: 'Reflection',
    label: 'Step 2 — Reflect',
    description: 'Meditate on what the passage means. Write down your thoughts and what God is revealing to you.',
  },
  {
    key: 'motivation',
    letter: 'M',
    title: 'Motivation',
    label: 'Step 3 — Be Inspired',
    description: 'Find inspiration and encouragement from the verse. Let it fuel your faith and hope for the day.',
  },
  {
    key: 'application',
    letter: 'A',
    title: 'Application',
    label: 'Step 4 — Apply',
    description: 'Write actionable steps to live out the verse today. Turn God\'s word into practical daily action.',
  },
];

export default function HowItWorks() {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <section className="how-it-works section" id="how-it-works">
      <div className="container">
        <h2 className="section-title">The R.R.M.A. Method</h2>
        <p className="section-subtitle">
          A structured, beautiful way to journal your devotional life.
          Four simple steps to deepen your walk with God every day.
        </p>

        <div ref={ref} className={`rrma-layout fade-in-section ${isVisible ? 'is-visible' : ''}`}>
          <div className="rrma-steps">
            {steps.map((step) => (
              <div key={step.key} className={`rrma-step rrma-step--${step.key}`}>
                <div className="rrma-dot">{step.letter}</div>
                <span className="rrma-label">{step.label}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>

          <div className="rrma-visual">
            <div className="rrma-mascot-scene">
              {/* Custom Arch Backdrop with R.R.M.A. Ribbon Gradient Glow */}
              <div className="rrma-backdrop-arch">
                <div className="rrma-backdrop-glow"></div>
                <div className="rrma-backdrop-lines"></div>
                <div className="rrma-backdrop-ring"></div>
              </div>

              {/* Floating aesthetic tags */}
              <div className="rrma-floating-pill">
                <span className="pill-icon">✍️</span>
                <span className="pill-text">Guided Journaling</span>
              </div>

              <div className="rrma-sparkle rrma-sparkle--1">✦</div>
              <div className="rrma-sparkle rrma-sparkle--2">✨</div>

              {/* Transparent Writing Mascot */}
              <img
                src="/images/mascot-writing-journal-transparent.png"
                alt="Shepema mascot writing devotional reflections in notebook"
                className="rrma-mascot-img"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
