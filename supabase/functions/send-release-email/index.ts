// Supabase Edge Function: send-release-email
// Supports Gmail SMTP (GMAIL_USER & GMAIL_APP_PASSWORD) or Resend API

// @ts-ignore - Deno runtime resolves npm packages dynamically
import { createClient } from "npm:@supabase/supabase-js@2";
// @ts-ignore - Deno runtime resolves npm packages dynamically
import nodemailer from "npm:nodemailer";

// Type declaration for Deno globals when viewed in standard Node IDE
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  releaseId?: string;
  version?: string;
  title?: string;
  releaseNotes?: string;
  apkUrl?: string;
  customSubject?: string;
  customMessage?: string;
  testEmailOnly?: string; // If provided, sends only to this test email
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_PASS = Deno.env.get("GMAIL_APP_PASSWORD");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || Deno.env.get("VITE_RESEND_API_KEY");

    if (!GMAIL_USER && !RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing GMAIL_USER / GMAIL_APP_PASSWORD or RESEND_API_KEY in Supabase secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: SendEmailRequest = await req.json();
    const {
      version = "v1.0.0",
      title = "New Shepema Update Available!",
      releaseNotes = "A new update with improvements and bug fixes is ready.",
      apkUrl = "https://shepema.com",
      customSubject,
      customMessage,
      testEmailOnly,
      releaseId,
    } = payload;

    let recipients: { email: string; name?: string }[] = [];

    if (testEmailOnly) {
      recipients = [{ email: testEmailOnly, name: "Admin (Test)" }];
    } else {
      // Fetch all active subscribers
      const { data: subscribers, error: subError } = await supabaseClient
        .from("subscribers")
        .select("email, name")
        .eq("is_active", true);

      if (subError) throw subError;
      if (!subscribers || subscribers.length === 0) {
        return new Response(
          JSON.stringify({ message: "No active subscribers found.", count: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      recipients = subscribers;
    }

    const emailSubject = customSubject || `🐑 Shepema Update: ${version} is now available!`;
    const formattedNotes = (releaseNotes || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<li style="margin-bottom: 6px;">${line.replace(/^[*-]\s*/, "")}</li>`)
      .join("");

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 20px 0; background-color: #FAF7F2; font-family: 'Georgia', serif; color: #2C2520; }
    .container { max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E8E0D4; overflow: hidden; box-shadow: 0 4px 20px rgba(44, 37, 32, 0.08); }
    .accent-bar { height: 5px; background: linear-gradient(90deg, #3A7D3A, #D4A84B, #C46246); }
    .header { background-color: #2D612D; color: #FFFFFF; padding: 28px 24px 24px; text-align: center; }
    .brand-badge { display: inline-block; background: rgba(255, 255, 255, 0.15); padding: 6px 16px; border-radius: 20px; margin-bottom: 8px; font-weight: bold; letter-spacing: 0.05em; font-size: 18px; }
    .header p { margin: 0; font-size: 13px; color: #EAF3EA; letter-spacing: 0.03em; }
    .content { padding: 28px 24px; }
    .badge { display: inline-block; background-color: #FFF8EC; color: #B28228; border: 1px solid #EADBBA; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; margin-bottom: 14px; }
    .title { font-size: 22px; color: #2C2520; margin: 0 0 14px; line-height: 1.3; }
    .verse { background-color: #FAF7F2; border-left: 4px solid #C46246; padding: 14px 18px; font-style: italic; color: #4A3E34; margin: 0 0 22px; border-radius: 0 8px 8px 0; }
    .verse cite { display: block; margin-top: 4px; font-size: 12px; font-style: normal; font-weight: bold; color: #C46246; }
    .notes-box { background-color: #FAF8F5; border: 1px solid #EAE2D5; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; }
    .notes-box h3 { margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #2D612D; }
    .notes-box ul { margin: 0; padding-left: 18px; color: #3D342C; font-size: 14px; line-height: 1.6; }
    .btn-container { text-align: center; margin: 28px 0 12px; }
    .btn { background-color: #2D612D; color: #FFFFFF !important; text-decoration: none; padding: 14px 34px; border-radius: 28px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(45, 97, 45, 0.3); }
    .footer { background-color: #FAF7F2; border-top: 1px solid #E8E0D4; padding: 18px 20px; text-align: center; font-size: 12px; color: #8A7D71; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="accent-bar"></div>
    <div class="header">
      <div class="brand-badge">
        <img src="https://raw.githubusercontent.com/bJOE2001/shepema-web/main/public/images/app-icon.jpg" alt="Shepema" width="26" height="26" style="vertical-align: middle; border-radius: 6px; margin-right: 8px; border: 1px solid rgba(255, 255, 255, 0.4);" />
        <span style="vertical-align: middle;">SHEPEMA</span>
      </div>
      <p>Guided by God's Word • Devotional Companion</p>
    </div>
    <div class="content">
      <span class="badge">✨ ${version} RELEASED</span>
      <h2 class="title">${title}</h2>
      
      <p style="font-size: 15px; line-height: 1.65; color: #4A3E34; margin: 0 0 20px;">
        ${customMessage || "A brand new update is ready for your quiet time journey! We've made improvements to help nurture your daily walk with the Word."}
      </p>

      <div class="verse">
        “Thy word is a lamp unto my feet, and a light unto my path.”
        <cite>— Psalm 119:105</cite>
      </div>

      <div class="notes-box">
        <h3>✦ What's New in this Version:</h3>
        <ul>
          ${formattedNotes || "<li>Performance enhancements and quiet time stability improvements</li>"}
        </ul>
      </div>

      <div class="btn-container">
        <a href="${apkUrl}" class="btn" target="_blank">⬇ Download APK (${version})</a>
      </div>

      <p style="text-align: center; font-size: 12px; color: #8A7D71; margin: 0;">
        Tap button to download update file directly to your Android device
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px;">Made with ❤️ and faith for your daily quiet time.</p>
      <p style="margin: 0; font-size: 11px; color: #A3968A;">You received this email because you subscribed for Shepema updates.</p>
    </div>
  </div>
</body>
</html>
    `;

    let sentCount = 0;

    // 1. Send via Gmail SMTP if configured
    if (GMAIL_USER && GMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: GMAIL_USER,
          pass: GMAIL_PASS,
        },
      });

      for (const recipient of recipients) {
        try {
          await transporter.sendMail({
            from: `"Shepema Updates" <${GMAIL_USER}>`,
            to: recipient.email,
            subject: emailSubject,
            html: emailHtml,
          });
          sentCount++;
        } catch (mailErr) {
          console.error(`Gmail SMTP send error for ${recipient.email}:`, mailErr);
        }
      }
    }
    // 2. Or fallback to Resend API
    else if (RESEND_API_KEY) {
      const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Shepema Updates <onboarding@resend.dev>";
      for (const recipient of recipients) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [recipient.email],
            subject: emailSubject,
            html: emailHtml,
          }),
        });

        if (res.ok) sentCount++;
      }
    }

    // Log the campaign in Supabase database if not a test
    if (!testEmailOnly && releaseId) {
      await supabaseClient.from("email_campaigns").insert({
        release_id: releaseId,
        subject: emailSubject,
        body_preview: releaseNotes.substring(0, 200),
        recipient_count: sentCount,
        status: sentCount > 0 ? "sent" : "failed",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        sentCount,
        totalRecipients: recipients.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
