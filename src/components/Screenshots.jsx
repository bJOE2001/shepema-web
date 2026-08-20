import { useState, useRef, useEffect } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const screenshots = [
  { src: '/images/screenshot-1.jpg', caption: 'Daily Dashboard & Streaks' },
  { src: '/images/screenshot-2.jpg', caption: 'Holy Scripture Reader' },
  { src: '/images/screenshot-3.jpg', caption: 'Devotional Journal History' },
  { src: '/images/screenshot-4.jpg', caption: 'R.R.M.A. Guided Reflection' },
  { src: '/images/screenshot-5.jpg', caption: 'Aesthetic Shareable Cards' },
  { src: '/images/screenshot-6.jpg', caption: 'Habit Calendar & Progress' },
];

export default function Screenshots() {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef(null);
  const [sectionRef, isVisible] = useScrollAnimation();

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const handleScroll = () => {
      const scrollLeft = track.scrollLeft;
      const slideWidth = track.querySelector('.screenshot-slide')?.offsetWidth || 260;
      const gap = 32;
      const index = Math.round(scrollLeft / (slideWidth + gap));
      setActiveIndex(Math.min(Math.max(0, index), screenshots.length - 1));
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => track.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (index) => {
    const track = trackRef.current;
    if (!track) return;
    const slideWidth = track.querySelector('.screenshot-slide')?.offsetWidth || 260;
    const gap = 32;
    track.scrollTo({ left: index * (slideWidth + gap), behavior: 'smooth' });
    setActiveIndex(index);
  };

  return (
    <section className="screenshots section" id="screenshots" ref={sectionRef}>
      <div className="container">
        <h2 className="section-title">See Shephema in Action</h2>
        <p className="section-subtitle">
          Explore the real, beautifully crafted interface built for your daily devotional walk.
        </p>
      </div>

      <div className={`screenshots-wrapper fade-in-section ${isVisible ? 'is-visible' : ''}`}>
        <div className="screenshots-track" ref={trackRef}>
          {screenshots.map((shot, i) => (
            <div key={i} className="screenshot-slide">
              <div className="screenshot-frame">
                <img src={shot.src} alt={shot.caption} loading="lazy" />
              </div>
              <p className="screenshot-caption">{shot.caption}</p>
            </div>
          ))}
        </div>

        <div className="screenshots-dots">
          {screenshots.map((_, i) => (
            <button
              key={i}
              className={`screenshots-dot ${i === activeIndex ? 'active' : ''}`}
              onClick={() => scrollTo(i)}
              aria-label={`Go to screenshot ${i + 1}: ${screenshots[i].caption}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
