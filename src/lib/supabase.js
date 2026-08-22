import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id')
);

// Fallback release if Supabase is not yet configured or offline
export const FALLBACK_RELEASE = {
  id: 'fallback-v1',
  version: 'v1.0.0',
  version_code: 1,
  title: 'Shepema v1.0.0 - Official Launch',
  release_notes: '✨ First official release of Shepema!\n- Guided Quiet Time with R.R.M.A. method\n- Offline Bibles (KJV, ASV, BBE, WEB)\n- Habit streak encouragement & daily reminder\n- Scripture journaling & verse memorization',
  apk_url: 'https://github.com/bJOE2001/shepema-web/releases/download/v1.0.0/Shepema-v1.0.0.apk',
  apk_file_name: 'Shepema-v1.0.0.apk',
  apk_size_formatted: '~108 MB',
  min_android_version: 'Android 8.0+',
  is_latest: true,
  is_published: true,
  download_count: 0,
  created_at: '2026-08-22T00:00:00Z',
};

// Initialize Supabase Client as a strict singleton
const getSupabaseClient = () => {
  if (!isSupabaseConfigured) return null;
  if (typeof window !== 'undefined' && window.__shepema_supabase) {
    return window.__shepema_supabase;
  }
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  if (typeof window !== 'undefined') {
    window.__shepema_supabase = client;
  }
  return client;
};

export const supabase = getSupabaseClient();

// ==============================================================================
// App Release Helpers
// ==============================================================================

/**
 * Fetch the latest published release for the public landing page.
 */
export async function getLatestRelease() {
  if (!supabase) {
    return FALLBACK_RELEASE;
  }

  try {
    const { data, error } = await supabase
      .from('app_releases')
      .select('*')
      .eq('is_published', true)
      .eq('is_latest', true)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching latest release from Supabase, using fallback:', error.message);
      return FALLBACK_RELEASE;
    }

    if (!data) {
      // If no release has is_latest=true, get the most recent published one
      const { data: recent, error: recentErr } = await supabase
        .from('app_releases')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentErr || !recent) return FALLBACK_RELEASE;
      return recent;
    }

    return data;
  } catch (err) {
    console.error('Failed to get latest release:', err);
    return FALLBACK_RELEASE;
  }
}

/**
 * Fetch all releases (for changelog modal or admin panel).
 */
export async function getAllReleases(includeUnpublished = false) {
  if (!supabase) {
    return [FALLBACK_RELEASE];
  }

  try {
    let query = supabase
      .from('app_releases')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Failed to get releases:', err);
    return [FALLBACK_RELEASE];
  }
}

/**
 * Upload an APK file to Supabase Storage bucket 'app-releases'.
 */
export async function uploadApkFile(file, onProgress) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set your credentials in .env.');
  }

  // Create clean filename with timestamp to prevent cache collision
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `builds/${timestamp}_${cleanName}`;

  // Supabase standard upload
  const { data, error } = await supabase.storage
    .from('app-releases')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Get public download URL
  const { data: urlData } = supabase.storage
    .from('app-releases')
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    fileName: file.name,
    filePath: data.path,
    sizeBytes: file.size,
    sizeFormatted: formatFileSize(file.size),
  };
}

/**
 * Create a new release in the database.
 */
export async function createRelease(releaseData) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('app_releases')
    .insert([releaseData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing release.
 */
export async function updateRelease(id, updates) {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('app_releases')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a release and its storage file if applicable.
 */
export async function deleteRelease(id, filePath) {
  if (!supabase) throw new Error('Supabase is not configured.');

  if (filePath) {
    try {
      await supabase.storage.from('app-releases').remove([filePath]);
    } catch (e) {
      console.warn('Could not delete storage file:', e);
    }
  }

  const { error } = await supabase
    .from('app_releases')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Increment download metric via RPC.
 */
export async function recordDownload(releaseId) {
  if (!supabase || !releaseId || releaseId.startsWith('fallback')) return;

  try {
    await supabase.rpc('increment_release_downloads', { target_release_id: releaseId });
  } catch (e) {
    console.debug('Failed to record download metric:', e);
  }
}

// ==============================================================================
// Subscribers & Email Management
// ==============================================================================

/**
 * Subscribe an email for update notifications.
 */
export async function subscribeNewsletter(email, name = '') {
  if (!supabase) {
    // Local demo simulation if Supabase is not yet configured
    return { success: true, simulated: true };
  }

  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('subscribers')
    .upsert(
      { email: cleanEmail, name: name.trim() || null, is_active: true },
      { onConflict: 'email' }
    )
    .select()
    .single();

  if (error) throw error;
  return { success: true, data };
}

/**
 * Fetch all subscribers (Admin only).
 */
export async function getSubscribers() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Delete or toggle subscriber status (Admin only).
 */
export async function toggleSubscriber(id, isActive) {
  if (!supabase) return;

  const { error } = await supabase
    .from('subscribers')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteSubscriber(id) {
  if (!supabase) return;

  const { error } = await supabase
    .from('subscribers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Dispatch update emails via Edge Function or direct Resend API.
 */
export async function sendReleaseNotification({
  releaseId,
  version,
  title,
  releaseNotes,
  apkUrl,
  customSubject,
  customMessage,
  testEmailOnly,
}) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  // 1. Try Supabase Edge Function first
  try {
    const { data, error } = await supabase.functions.invoke('send-release-email', {
      body: {
        releaseId,
        version,
        title,
        releaseNotes,
        apkUrl,
        customSubject,
        customMessage,
        testEmailOnly,
      },
    });

    if (!error && data) {
      return data;
    }
    console.warn('Edge function returned error, attempting direct Resend fallback if API key configured:', error);
  } catch (err) {
    console.warn('Edge function unavailable:', err);
  }

  // 2. Direct Resend API fallback if configured
  const apiKey = resendApiKey || localStorage.getItem('shepema_resend_key');
  if (apiKey) {
    return await sendDirectResendEmail({
      apiKey,
      releaseId,
      version,
      title,
      releaseNotes,
      apkUrl,
      customSubject,
      customMessage,
      testEmailOnly,
    });
  }

  throw new Error(
    'No email service configured. Please deploy the Supabase Edge Function or set your Resend API Key in Settings.'
  );
}

/**
 * Direct browser fallback sender using Resend API.
 */
async function sendDirectResendEmail({
  apiKey,
  releaseId,
  version,
  title,
  releaseNotes,
  apkUrl,
  customSubject,
  customMessage,
  testEmailOnly,
}) {
  let recipients = [];

  if (testEmailOnly) {
    recipients = [{ email: testEmailOnly }];
  } else {
    const subs = await getSubscribers();
    recipients = subs.filter((s) => s.is_active);
  }

  if (recipients.length === 0) {
    return { success: true, count: 0, message: 'No active subscribers found.' };
  }

  const emailSubject = customSubject || `🐑 Shepema Update: ${version} is now available!`;
  const formattedNotes = (releaseNotes || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<li style="margin-bottom: 6px;">${l.replace(/^[*-]\s*/, '')}</li>`)
    .join('');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 20px 0; background-color: #FAF7F2; font-family: 'Georgia', serif; color: #2C2520;">
      <div style="max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E8E0D4; overflow: hidden; box-shadow: 0 4px 20px rgba(44, 37, 32, 0.08);">
        
        <!-- Top Accent Bar -->
        <div style="height: 5px; background: linear-gradient(90deg, #3A7D3A, #D4A84B, #C46246);"></div>

        <!-- Header -->
        <div style="background-color: #2D612D; color: #FFFFFF; padding: 28px 24px 24px; text-align: center;">
          <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); padding: 6px 18px; border-radius: 24px; margin-bottom: 8px;">
            <table cellpadding="0" cellspacing="0" border="0" style="display: inline-block; vertical-align: middle;">
              <tr>
                <td style="vertical-align: middle; padding-right: 8px;">
                  <img src="https://raw.githubusercontent.com/bJOE2001/shepema-web/main/public/images/app-icon.jpg" alt="Shepema" width="28" height="28" style="border-radius: 7px; display: block; border: 1px solid rgba(255, 255, 255, 0.4);" />
                </td>
                <td style="vertical-align: middle;">
                  <strong style="font-size: 18px; letter-spacing: 0.05em; color: #FFFFFF;">SHEPEMA</strong>
                </td>
              </tr>
            </table>
          </div>
          <p style="margin: 0; font-size: 13px; color: #EAF3EA; letter-spacing: 0.03em;">
            Guided by God's Word • Devotional Companion
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 28px 24px;">
          <div style="margin-bottom: 12px;">
            <span style="display:inline-block; background: #FFF8EC; color: #B28228; border: 1px solid #EADBBA; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold;">
              ✨ ${version} RELEASED
            </span>
          </div>

          <h2 style="font-size: 22px; margin: 0 0 14px; color: #2C2520; line-height: 1.3;">${title}</h2>
          <p style="font-size: 15px; line-height: 1.65; color: #4A3E34; margin: 0 0 20px;">
            ${customMessage || "A brand new update is ready for your quiet time journey! We've made improvements to support your daily walk with the Word."}
          </p>
          
          <!-- Scripture Card -->
          <div style="background-color: #FAF7F2; border-left: 4px solid #C46246; padding: 14px 18px; margin: 0 0 22px; border-radius: 0 8px 8px 0;">
            <p style="margin: 0 0 4px; font-style: italic; color: #4A3E34; font-size: 14px; line-height: 1.5;">
              “Thy word is a lamp unto my feet, and a light unto my path.”
            </p>
            <span style="font-size: 12px; font-weight: bold; color: #C46246;">— Psalm 119:105</span>
          </div>

          <!-- What's New Box -->
          <div style="background-color: #FAF8F5; border: 1px solid #EAE2D5; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
            <h4 style="margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #2D612D;">✦ What's New in this Version:</h4>
            <ul style="margin: 0; padding-left: 18px; color: #3D342C; font-size: 14px; line-height: 1.6;">${formattedNotes}</ul>
          </div>

          <!-- Download CTA -->
          <div style="text-align: center; margin: 28px 0 12px;">
            <a href="${apkUrl}" style="background-color: #2D612D; color: #FFFFFF !important; text-decoration: none; padding: 14px 34px; border-radius: 28px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(45, 97, 45, 0.3);">
              ⬇ Download APK (${version})
            </a>
          </div>

          <p style="text-align: center; font-size: 12px; color: #8A7D71; margin: 0;">
            Tap button to download the update file directly to your Android device
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #FAF7F2; border-top: 1px solid #E8E0D4; padding: 18px 20px; text-align: center; font-size: 12px; color: #8A7D71; line-height: 1.5;">
          <p style="margin: 0 0 4px;">Made with ❤️ and faith for your daily quiet time.</p>
          <p style="margin: 0; font-size: 11px; color: #A3968A;">You received this email because you subscribed for Shepema updates.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  let sentCount = 0;
  for (const r of recipients) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Shepema Updates <onboarding@resend.dev>',
          to: [r.email],
          subject: emailSubject,
          html: emailHtml,
        }),
      });
      if (res.ok) sentCount++;
    } catch (e) {
      console.error('Failed to send email to', r.email, e);
    }
  }

  // Record campaign in supabase if not test
  if (!testEmailOnly && releaseId && supabase) {
    await supabase.from('email_campaigns').insert({
      release_id: releaseId,
      subject: emailSubject,
      body_preview: releaseNotes?.substring(0, 150),
      recipient_count: sentCount,
      status: sentCount > 0 ? 'sent' : 'failed',
    });
  }

  return { success: true, count: sentCount, total: recipients.length };
}

// ==============================================================================
// Utility & Formatting
// ==============================================================================

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
