import { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Screenshots from './components/Screenshots';
import HowItWorks from './components/HowItWorks';
import InstallGuide from './components/InstallGuide';
import About from './components/About';
import DownloadCTA from './components/DownloadCTA';
import SubscribeSection from './components/SubscribeSection';
import Footer from './components/Footer';
import ReleaseHistoryModal from './components/ReleaseHistoryModal';
import FeedbackModal from './components/FeedbackModal';
import AdminLayout from './components/admin/AdminLayout';
import { MessageSquare } from 'lucide-react';

export default function App() {
  const [isAdminView, setIsAdminView] = useState(() => {
    return (
      window.location.pathname.startsWith('/admin') ||
      window.location.pathname === '/admin'
    );
  });
  const [showChangelog, setShowChangelog] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminView(
        window.location.pathname.startsWith('/admin') ||
        window.location.pathname === '/admin'
      );
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const exitAdmin = () => {
    window.history.pushState({}, '', '/');
    setIsAdminView(false);
  };

  if (isAdminView) {
    return <AdminLayout onExitAdmin={exitAdmin} />;
  }

  return (
    <>
      <Navbar
        onOpenChangelog={() => setShowChangelog(true)}
        onOpenFeedback={() => setShowFeedback(true)}
      />
      <main>
        <Hero onOpenChangelog={() => setShowChangelog(true)} />
        <Features />
        <Screenshots />
        <HowItWorks />
        <InstallGuide />
        <About />
        <SubscribeSection />
        <DownloadCTA onOpenChangelog={() => setShowChangelog(true)} />
      </main>
      <Footer
        onOpenChangelog={() => setShowChangelog(true)}
        onOpenFeedback={() => setShowFeedback(true)}
      />

      {/* Floating Feedback Trigger Button */}
      <button
        type="button"
        className="floating-feedback-btn"
        onClick={() => setShowFeedback(true)}
        title="Leave Feedback or Report a Bug"
      >
        <MessageSquare size={18} />
        <span>Feedback</span>
      </button>

      <ReleaseHistoryModal
        isOpen={showChangelog}
        onClose={() => setShowChangelog(false)}
      />

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
    </>
  );
}
