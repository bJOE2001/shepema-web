import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import AdminLogin from './AdminLogin';
import ReleaseManager from './ReleaseManager';
import EmailBroadcaster from './EmailBroadcaster';
import SubscriberList from './SubscriberList';
import FeedbackManager from './FeedbackManager';
import SetupGuide from './SetupGuide';
import {
  UploadCloud,
  Mail,
  Users,
  MessageSquare,
  BookOpen,
  LogOut,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import '../../styles/admin.css';

export default function AdminLayout({ onExitAdmin }) {
  const [sessionUser, setSessionUser] = useState(null);
  const [activeTab, setActiveTab] = useState('releases');
  const [broadcastTargetRelease, setBroadcastTargetRelease] = useState(null);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setSessionUser(session.user);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSessionUser(session?.user || null);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSessionUser(null);
  };

  const handleOpenEmailBroadcastForRelease = (rel) => {
    setBroadcastTargetRelease(rel);
    setActiveTab('email');
  };

  if (!sessionUser) {
    return <AdminLogin onLoginSuccess={(user) => setSessionUser(user)} />;
  }

  return (
    <div className="admin-wrapper">
      {/* Admin Top Navbar */}
      <header className="admin-header">
        <div className="admin-header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href="#" className="admin-brand" onClick={(e) => { e.preventDefault(); setActiveTab('releases'); }}>
              <img src="/images/app-icon.jpg" alt="Shepema" />
              <span>Shepema</span>
            </a>
            <span className="admin-badge">Admin</span>
          </div>

          <nav className="admin-nav">
            <button
              className={`admin-nav-btn ${activeTab === 'releases' ? 'active' : ''}`}
              onClick={() => setActiveTab('releases')}
            >
              <UploadCloud size={16} />
              Releases & APKs
            </button>

            <button
              className={`admin-nav-btn ${activeTab === 'email' ? 'active' : ''}`}
              onClick={() => setActiveTab('email')}
            >
              <Mail size={16} />
              Email Updates
            </button>

            <button
              className={`admin-nav-btn ${activeTab === 'subscribers' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscribers')}
            >
              <Users size={16} />
              Subscribers
            </button>

            <button
              className={`admin-nav-btn ${activeTab === 'feedback' ? 'active' : ''}`}
              onClick={() => setActiveTab('feedback')}
            >
              <MessageSquare size={16} />
              User Feedback
            </button>

            <button
              className={`admin-nav-btn ${activeTab === 'setup' ? 'active' : ''}`}
              onClick={() => setActiveTab('setup')}
            >
              <BookOpen size={16} />
              Setup Guide
            </button>
          </nav>

          <div className="admin-header-actions">
            <button
              className="admin-exit-btn"
              onClick={onExitAdmin}
              title="Return to Public Website"
            >
              <ExternalLink size={14} />
              Live Site
            </button>

            <button
              className="admin-exit-btn"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Tab Content */}
      <main className="admin-main">
        {activeTab === 'releases' && (
          <ReleaseManager onOpenEmailBroadcast={handleOpenEmailBroadcastForRelease} />
        )}

        {activeTab === 'email' && (
          <EmailBroadcaster selectedRelease={broadcastTargetRelease} />
        )}

        {activeTab === 'subscribers' && (
          <SubscriberList />
        )}

        {activeTab === 'feedback' && (
          <FeedbackManager />
        )}

        {activeTab === 'setup' && (
          <SetupGuide />
        )}
      </main>
    </div>
  );
}
