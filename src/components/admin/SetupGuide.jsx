import { useState } from 'react';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Database,
  HardDrive,
  Mail,
  KeyRound,
  ExternalLink,
  Terminal,
} from 'lucide-react';

export default function SetupGuide() {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const sqlCode = `-- ==============================================================================
-- Shepema Web Backend - Supabase Setup Script
-- Copy and paste this directly into Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. App Releases Table
CREATE TABLE IF NOT EXISTS public.app_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,
    version_code INTEGER DEFAULT 1,
    title TEXT,
    release_notes TEXT,
    apk_url TEXT NOT NULL,
    apk_file_name TEXT,
    apk_size_bytes BIGINT,
    apk_size_formatted TEXT DEFAULT '~108 MB',
    min_android_version TEXT DEFAULT 'Android 8.0+',
    is_latest BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_releases_latest ON public.app_releases (is_latest, is_published, created_at DESC);

-- 2. Subscribers Table
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    source TEXT DEFAULT 'web_landing',
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Email Campaigns Table
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID REFERENCES public.app_releases(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    body_preview TEXT,
    recipient_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. User Feedbacks Table (Bugs, Features, General)
CREATE TABLE IF NOT EXISTS public.user_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('bug', 'feature', 'general', 'content')),
    name TEXT,
    email TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    app_version TEXT,
    device_info TEXT,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'reviewed', 'in_progress', 'resolved', 'archived')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON public.user_feedbacks (status, type, created_at DESC);

-- 5. Single Latest Release Trigger
CREATE OR REPLACE FUNCTION handle_latest_release()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_latest = true THEN
        UPDATE public.app_releases
        SET is_latest = false
        WHERE id != NEW.id AND is_latest = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_ensure_single_latest_release ON public.app_releases;
CREATE TRIGGER tr_ensure_single_latest_release
BEFORE INSERT OR UPDATE OF is_latest ON public.app_releases
FOR EACH ROW
WHEN (NEW.is_latest = true)
EXECUTE FUNCTION handle_latest_release();

-- 6. Atomic RPC function for downloads
CREATE OR REPLACE FUNCTION increment_release_downloads(target_release_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.app_releases
    SET download_count = COALESCE(download_count, 0) + 1
    WHERE id = target_release_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Enable RLS
ALTER TABLE public.app_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedbacks ENABLE ROW LEVEL SECURITY;

-- 8. Policies
CREATE POLICY "Allow public read published releases" ON public.app_releases FOR SELECT USING (is_published = true);
CREATE POLICY "Allow auth manage releases" ON public.app_releases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public subscribe" ON public.subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow auth manage subscribers" ON public.subscribers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow auth manage email campaigns" ON public.email_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public submit feedback" ON public.user_feedbacks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow auth manage feedbacks" ON public.user_feedbacks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. Storage Bucket for APKs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('app-releases', 'app-releases', true, 524288000, ARRAY['application/vnd.android.package-archive', 'application/octet-stream', 'application/zip'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 524288000;

CREATE POLICY "Public read app-releases bucket" ON storage.objects FOR SELECT USING (bucket_id = 'app-releases');
CREATE POLICY "Auth upload app-releases bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'app-releases');
CREATE POLICY "Auth manage app-releases bucket" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'app-releases') WITH CHECK (bucket_id = 'app-releases');`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'sql') {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } else {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 3000);
    }
  };

  return (
    <div>
      {/* Status Bar */}
      <div
        className="admin-card"
        style={{
          borderLeft: `4px solid ${isSupabaseConfigured ? 'var(--brand-green)' : '#D4A84B'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isSupabaseConfigured ? (
                <>
                  <CheckCircle2 color="var(--brand-green)" size={22} />
                  <span>Supabase Backend Connected!</span>
                </>
              ) : (
                <>
                  <XCircle color="#D4A84B" size={22} />
                  <span>Supabase Setup Needed</span>
                </>
              )}
            </h3>
            <p style={{ color: 'var(--ink-secondary)', margin: 0, fontSize: '0.9rem' }}>
              {isSupabaseConfigured
                ? `Connected to project: ${supabaseUrl}`
                : 'Follow the 4 quick steps below to connect your free Supabase project.'}
            </p>
          </div>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-admin btn-admin-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            <ExternalLink size={14} /> Open Supabase Dashboard
          </a>
        </div>
      </div>

      {/* Step 1: Environment Variables */}
      <div className="admin-card">
        <h3 className="admin-card-title">
          <KeyRound size={20} color="var(--brand-green)" />
          Step 1: Set Credentials in <code>.env</code>
        </h3>
        <p className="admin-card-desc">
          Go to your <strong>Supabase Dashboard &gt; Project Settings &gt; API</strong> and copy your Project URL and Anon Public Key into your local <code>.env</code> file:
        </p>

        <div className="sql-code-box">
          <button className="copy-float-btn" onClick={() => copyToClipboard(`VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key-here`, 'env')}>
            {copiedEnv ? <Check size={14} /> : <Copy size={14} />} {copiedEnv ? 'Copied' : 'Copy'}
          </button>
          <pre style={{ margin: 0 }}>
            {`# In c:\\xampp\\htdocs\\shepema-web\\.env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`}
          </pre>
        </div>
      </div>

      {/* Step 2: Run SQL Migration */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="admin-card-title">
              <Database size={20} color="var(--brand-green)" />
              Step 2: Run Database Schema Script
            </h3>
            <p className="admin-card-desc">
              Go to <strong>Supabase Dashboard &gt; SQL Editor &gt; New Query</strong>, paste the script below, and click <strong>RUN</strong>:
            </p>
          </div>
          <button className="btn-admin" onClick={() => copyToClipboard(sqlCode, 'sql')}>
            {copiedSql ? <Check size={16} /> : <Copy size={16} />}
            {copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}
          </button>
        </div>

        <div className="sql-code-box" style={{ maxHeight: '280px' }}>
          <pre style={{ margin: 0 }}>{sqlCode}</pre>
        </div>
      </div>

      {/* Step 3: Admin Auth User */}
      <div className="admin-card">
        <h3 className="admin-card-title">
          <CheckCircle2 size={20} color="var(--brand-green)" />
          Step 3: Create an Admin User
        </h3>
        <p className="admin-card-desc">
          Go to <strong>Supabase Dashboard &gt; Authentication &gt; Users &gt; Add User &gt; Create User</strong>.
          Enter your admin email and password. You will use this to sign into the Shepema Admin Portal!
        </p>
      </div>

      {/* Step 4: Email Notifications / Edge Function */}
      <div className="admin-card">
        <h3 className="admin-card-title">
          <Mail size={20} color="var(--brand-green)" />
          Step 4: Configure Email Notifications (Resend / Edge Function)
        </h3>
        <p className="admin-card-desc">
          You can deploy the ready-made Supabase Edge Function to dispatch update emails to all subscribers:
        </p>

        <div className="sql-code-box">
          <pre style={{ margin: 0 }}>
            {`# In your terminal or command prompt:
npx supabase login
npx supabase secrets set RESEND_API_KEY=re_your_api_key
npx supabase functions deploy send-release-email --no-verify-jwt`}
          </pre>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--ink-secondary)', marginTop: '0.75rem' }}>
          💡 <em>Tip: You can also obtain a free API key at <a href="https://resend.com" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-green)' }}>resend.com</a> and enter it directly in the Email Broadcaster settings without running any CLI commands!</em>
        </p>
      </div>
    </div>
  );
}
