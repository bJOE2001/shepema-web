-- ==============================================================================
-- Shepema Web Backend - Supabase Database Schema & Storage Setup
-- ==============================================================================

-- 1. Create App Releases Table
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

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_app_releases_latest ON public.app_releases (is_latest, is_published, created_at DESC);

-- 2. Create Subscribers Table for Email Updates
CREATE TABLE IF NOT EXISTS public.subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    source TEXT DEFAULT 'web_landing',
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscribers_active ON public.subscribers (is_active, email);

-- 3. Create Email Campaigns Table for Broadcast Logs
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_id UUID REFERENCES public.app_releases(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    body_preview TEXT,
    recipient_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create User Feedbacks Table (Bugs, Feature Requests, General Feedback)
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

-- 4. Function & Trigger to ensure only one release is marked as latest
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

-- 5. Atomic RPC function to increment download counts
CREATE OR REPLACE FUNCTION increment_release_downloads(target_release_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.app_releases
    SET download_count = COALESCE(download_count, 0) + 1
    WHERE id = target_release_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.app_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedbacks ENABLE ROW LEVEL SECURITY;

-- 7. App Releases Policies
-- Anyone (even anonymous) can view published releases
CREATE POLICY "Allow public read published releases"
    ON public.app_releases FOR SELECT
    USING (is_published = true);

-- Authenticated admins can view all releases (including drafts)
CREATE POLICY "Allow auth read all releases"
    ON public.app_releases FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated admins can create, edit, or delete releases
CREATE POLICY "Allow auth insert releases"
    ON public.app_releases FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow auth update releases"
    ON public.app_releases FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow auth delete releases"
    ON public.app_releases FOR DELETE
    TO authenticated
    USING (true);

-- 8. Subscribers Policies
-- Anyone can subscribe their email
CREATE POLICY "Allow public subscribe"
    ON public.subscribers FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Authenticated admins can read, update, or delete subscribers
CREATE POLICY "Allow auth manage subscribers"
    ON public.subscribers FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 9. Email Campaigns Policies
CREATE POLICY "Allow auth manage email campaigns"
    ON public.email_campaigns FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 10. User Feedbacks Policies
-- Anyone can submit feedback or report bugs
CREATE POLICY "Allow public submit feedback"
    ON public.user_feedbacks FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Authenticated admins can view, update, or delete feedback
CREATE POLICY "Allow auth manage feedbacks"
    ON public.user_feedbacks FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 11. Storage Bucket Setup for APK Releases
-- Create 'app-releases' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'app-releases',
    'app-releases',
    true,
    524288000, -- 500 MB limit
    ARRAY['application/vnd.android.package-archive', 'application/octet-stream', 'application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 524288000;

-- Storage RLS Policies:
-- Public can download files from app-releases bucket
CREATE POLICY "Public read app-releases bucket"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'app-releases');

-- Authenticated admins can upload files to app-releases
CREATE POLICY "Auth upload app-releases bucket"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'app-releases');

-- Authenticated admins can update/delete files in app-releases
CREATE POLICY "Auth update app-releases bucket"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'app-releases');

CREATE POLICY "Auth delete app-releases bucket"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'app-releases');

-- 11. Initial Seed Data (Default v1.0.0 Release)
INSERT INTO public.app_releases (
    version,
    version_code,
    title,
    release_notes,
    apk_url,
    apk_file_name,
    apk_size_formatted,
    min_android_version,
    is_latest,
    is_published
)
VALUES (
    'v1.0.0',
    1,
    'Shepema v1.0.0 - Official Launch',
    '✨ First official release of Shepema!
- Cozy Devotional Companion with R.R.M.A. method
- Offline Bibles (KJV, ASV, BBE, WEB)
- Daily Quiet Time streak encouragement
- Custom journal with scripture tagging',
    'https://github.com/bJOE2001/shepema-web/releases/download/v1.0.0/Shepema-v1.0.0.apk',
    'Shepema-v1.0.0.apk',
    '~108 MB',
    'Android 8.0+',
    true,
    true
)
ON CONFLICT DO NOTHING;
