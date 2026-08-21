import { useState, useRef, useEffect, useCallback } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const screenshots = [
  { src: '/images/screenshot-1.jpg', caption: 'Daily Dashboard & Streaks' },
  { src: '/images/screenshot-2.jpg', caption: 'Holy Scripture Reader' },
  { src: '/images/screenshot-3.jpg', caption: 'Offline Bible Versions' },
  { src: '/images/screenshot-4.jpg', caption: 'Devotional Journal Book' },
  { src: '/images/screenshot-5.jpg', caption: 'R.R.M.A. Reflection Folio' },
  { src: '/images/screenshot-6.jpg', caption: 'Aesthetic Shareable Cards' },
  { src: '/images/screenshot-7.jpg', caption: 'Habit Calendar & Progress' },
  { src: '/images/screenshot-8.jpg', caption: 'Daily Habit Reminders' },
];

export default function Screenshots() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef(null);
  const [sectionRef, isVisible] = useScrollAnimation();

  const scrollTo = useCallback((index) => {
    const track = trackRef.current;
    if (!track) return;
    const slides = track.querySelectorAll('.screenshot-slide');
    if (slides[index]) {
      const slide = slides[index];
      const targetScroll = slide.offsetLeft - (track.offsetWidth - slide.offsetWidth) / 2;
      track.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    }
    setActiveIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => {
      const next = (prev + 1) % screenshots.length;
      scrollTo(next);
      return next;
    });
  }, [scrollTo]);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => {
      const prevIdx = prev === 0 ? screenshots.length - 1 : prev - 1;
      scrollTo(prevIdx);
      return prevIdx;
    });
  }, [scrollTo]);

  // Automated Autoplay: shifts every 3.2s when not hovered
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 3200);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Sync active dot on manual scroll
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let timeout;
    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const slides = track.querySelectorAll('.screenshot-slide');
        const trackCenter = track.scrollLeft + track.offsetWidth / 2;
        let closestIndex = 0;
        let minDistance = Infinity;

        slides.forEach((slide, idx) => {
          const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
          const distance = Math.abs(trackCenter - slideCenter);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = idx;
          }
        });
        setActiveIndex(closestIndex);
      }, 60);
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <section className="screenshots section" id="screenshots" ref={sectionRef}>
      <div className="container">
        <h2 className="section-title">See Shepema in Action</h2>
        <p className="section-subtitle">
          Explore the real, beautifully crafted interface built for your daily devotional walk.
        </p>
      </div>

      <div
        className={`screenshots-wrapper fade-in-section ${isVisible ? 'is-visible' : ''}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <button
          className="screenshots-arrow screenshots-arrow--prev"
          onClick={prevSlide}
          aria-label="Previous screenshot"
        >
          ‹
        </button>

        <div className="screenshots-track" ref={trackRef}>
          {screenshots.map((shot, i) => (
            <div
              key={i}
              className={`screenshot-slide ${i === activeIndex ? 'is-active' : ''}`}
              onClick={() => scrollTo(i)}
            >
              <div className="screenshot-frame">
                <img src={shot.src} alt={shot.caption} loading="lazy" />
              </div>
              <p className="screenshot-caption">{shot.caption}</p>
            </div>
          ))}
        </div>

        <button
          className="screenshots-arrow screenshots-arrow--next"
          onClick={nextSlide}
          aria-label="Next screenshot"
        >
          ›
        </button>

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
