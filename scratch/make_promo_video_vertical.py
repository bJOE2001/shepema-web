import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import subprocess
import imageio_ffmpeg
import qrcode

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

WIDTH = 1080
HEIGHT = 1920
FPS = 30

# Colors
BG_TOP = (250, 247, 242)
BG_BOTTOM = (243, 237, 227)
INK_PRIMARY = (42, 37, 32)
INK_SECONDARY = (95, 85, 75)
INK_MUTED = (140, 130, 120)
BRAND_GREEN = (44, 104, 59)
BRAND_GREEN_LIGHT = (235, 246, 238)
BRAND_GOLD = (195, 140, 35)
BRAND_GOLD_LIGHT = (255, 250, 235)
BRAND_TERRA = (185, 80, 55)
BRAND_TERRA_LIGHT = (254, 242, 240)
BRAND_BLUE = (55, 115, 175)
BRAND_BLUE_LIGHT = (240, 246, 254)
CARD_BG = (255, 255, 255)
CARD_BORDER = (228, 220, 210)

# Fonts
FONT_DIR = os.environ.get('WINDIR', 'C:\\Windows') + '\\Fonts'
font_hero = ImageFont.truetype(os.path.join(FONT_DIR, 'georgiab.ttf'), 56)
font_title = ImageFont.truetype(os.path.join(FONT_DIR, 'georgiab.ttf'), 48)
font_subtitle = ImageFont.truetype(os.path.join(FONT_DIR, 'segoeui.ttf'), 26)
font_pill = ImageFont.truetype(os.path.join(FONT_DIR, 'segoeuib.ttf'), 18)
font_card_title = ImageFont.truetype(os.path.join(FONT_DIR, 'segoeuib.ttf'), 22)
font_card_desc = ImageFont.truetype(os.path.join(FONT_DIR, 'segoeui.ttf'), 18)
font_url = ImageFont.truetype(os.path.join(FONT_DIR, 'segoeuib.ttf'), 28)
font_badge = ImageFont.truetype(os.path.join(FONT_DIR, 'segoeuib.ttf'), 20)
font_sym_sm = ImageFont.truetype(os.path.join(FONT_DIR, 'seguisym.ttf'), 18)
font_sym_md = ImageFont.truetype(os.path.join(FONT_DIR, 'seguisym.ttf'), 24)
font_sym_lg = ImageFont.truetype(os.path.join(FONT_DIR, 'seguisym.ttf'), 32)

# Load Images
def load_img(rel_path):
    full_path = os.path.join(r'c:\xampp\htdocs\shepema-web', rel_path)
    if os.path.exists(full_path):
        return Image.open(full_path).convert('RGBA')
    return None

shots = {
    'dash': load_img('public/images/screenshot-1.jpg'),
    'bible': load_img('public/images/screenshot-2.jpg'),
    'offline': load_img('public/images/screenshot-3.jpg'),
    'cover': load_img('public/images/screenshot-4.jpg'),
    'folio': load_img('public/images/screenshot-5.jpg'),
    'card': load_img('public/images/screenshot-6.jpg'),
    'calendar': load_img('public/images/screenshot-7.jpg'),
    'reminders': load_img('public/images/screenshot-8.jpg'),
}

mascot_cozy = load_img('public/images/mascot-cozy-reading-transparent.png')
mascot_holding = load_img('public/images/mascot-holding-bible-transparent.png')
mascot_journal = load_img('public/images/mascot-writing-journal-transparent.png')
app_icon = load_img('public/images/app-icon.jpg')

# Generate Crisp QR Code
qr = qrcode.QRCode(version=1, box_size=10, border=1)
qr.add_data('https://shepema-web.vercel.app/')
qr.make(fit=True)
qr_img = qr.make_image(fill_color='#2C683B', back_color='#FFFFFF').convert('RGBA')

# Animation Easing
def ease_out_cubic(t):
    t = max(0.0, min(1.0, t))
    return 1.0 - (1.0 - t)**3

def ease_in_out_cubic(t):
    t = max(0.0, min(1.0, t))
    if t < 0.5:
        return 4.0 * t * t * t
    else:
        return 1.0 - ((-2.0 * t + 2.0)**3) / 2.0

def ease_out_back(t):
    t = max(0.0, min(1.0, t))
    c1 = 1.70158
    c3 = c1 + 1.0
    return 1.0 + c3 * ((t - 1.0)**3) + c1 * ((t - 1.0)**2)

# Create Vertical Phone Mockup Graphic (Large & Clear)
def create_vertical_phone_frame(screen_img, target_width=540, target_height=1200):
    screen_resized = screen_img.resize((target_width, target_height), Image.Resampling.LANCZOS)
    bezel = 16
    frame_w = target_width + bezel * 2
    frame_h = target_height + bezel * 2
    corner_radius = 48
    
    frame = Image.new('RGBA', (frame_w, frame_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)
    
    # Phone body (Dark Titanium)
    draw.rounded_rectangle([0, 0, frame_w, frame_h], radius=corner_radius, fill=(28, 30, 34, 255), outline=(65, 70, 75, 255), width=2)
    
    # Screen mask
    mask = Image.new('L', (target_width, target_height), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, target_width, target_height], radius=corner_radius - 8, fill=255)
    
    frame.paste(screen_resized, (bezel, bezel), mask)
    
    # Camera notch pill
    notch_w, notch_h = 100, 22
    notch_x = (frame_w - notch_w) // 2
    notch_y = bezel + 8
    draw.rounded_rectangle([notch_x, notch_y, notch_x + notch_w, notch_y + notch_h], radius=11, fill=(12, 12, 15, 255))
    draw.ellipse([notch_x + 14, notch_y + 5, notch_x + 26, notch_y + 17], fill=(30, 40, 55, 255))
    
    # Inner border highlight
    draw.rounded_rectangle([bezel, bezel, bezel + target_width, bezel + target_height], radius=corner_radius - 8, outline=(220, 220, 220, 35), width=1)
    
    return frame

phone_cache_v = {}
for k, img in shots.items():
    if img:
        phone_cache_v[k] = create_vertical_phone_frame(img)

# Generate Vertical Background
def get_vertical_base_bg(frame_num):
    bg = Image.new('RGBA', (WIDTH, HEIGHT), BG_TOP)
    draw = ImageDraw.Draw(bg)
    
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * ratio)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * ratio)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b, 255))
        
    t = frame_num / FPS
    orb1_x = int(WIDTH * 0.3 + math.sin(t * 0.5) * 60)
    orb1_y = int(HEIGHT * 0.25 + math.cos(t * 0.4) * 60)
    orb2_x = int(WIDTH * 0.7 + math.cos(t * 0.6) * 70)
    orb2_y = int(HEIGHT * 0.75 + math.sin(t * 0.5) * 70)
    
    orbs = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    orbs_draw = ImageDraw.Draw(orbs)
    orbs_draw.ellipse([orb1_x - 300, orb1_y - 300, orb1_x + 300, orb1_y + 300], fill=(220, 242, 228, 55))
    orbs_draw.ellipse([orb2_x - 340, orb2_y - 340, orb2_x + 340, orb2_y + 340], fill=(255, 246, 222, 60))
    
    # Ambient sparkles
    for i in range(16):
        sp_x = int((i * 127 + t * 25) % WIDTH)
        sp_y = int((i * 113 + math.sin(t + i) * 35 + HEIGHT * 0.1) % HEIGHT)
        alpha = int((math.sin(t * 3.2 + i) + 1.0) * 0.5 * 100)
        orbs_draw.text((sp_x, sp_y), '✦', fill=(BRAND_GOLD[0], BRAND_GOLD[1], BRAND_GOLD[2], alpha), font=font_sym_sm)

    return Image.alpha_composite(bg, orbs)

# Helper: Draw Vertical Shadowed Phone
def draw_phone_v(canvas, phone_img, center_x, center_y, scale=1.0):
    if phone_img is None:
        return
    
    w = int(phone_img.width * scale)
    h = int(phone_img.height * scale)
    scaled_phone = phone_img.resize((w, h), Image.Resampling.LANCZOS)
    
    # Soft Shadow
    shadow_w = w + 80
    shadow_h = h + 80
    shadow = Image.new('RGBA', (shadow_w, shadow_h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle([40, 40, shadow_w - 40, shadow_h - 40], radius=int(48 * scale), fill=(30, 20, 12, 50))
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    
    px = int(center_x - scaled_phone.width / 2)
    py = int(center_y - scaled_phone.height / 2)
    
    canvas.paste(shadow, (int(center_x - shadow.width / 2), int(center_y - shadow.height / 2 + 14)), shadow)
    canvas.paste(scaled_phone, (px, py), scaled_phone)

# Render Scene 1 (Vertical): Hero Intro (4.8s)
def render_v_scene_1(frame_idx, total_f):
    sec = frame_idx / FPS
    canvas = get_vertical_base_bg(frame_idx)
    draw = ImageDraw.Draw(canvas)
    
    pop_prog = ease_out_back(min(1.0, sec / 1.0))
    scale = 0.85 + pop_prog * 0.15
    
    # Mascot Center
    if mascot_holding:
        m_w = int(480 * scale)
        m_h = int(480 * scale)
        m_img = mascot_holding.resize((m_w, m_h), Image.Resampling.LANCZOS)
        bob_y = int(math.sin(sec * 3.5) * 10)
        canvas.paste(m_img, (int(WIDTH / 2 - m_w / 2), int(480 + (1.0 - pop_prog) * 140 + bob_y)), m_img)
        
    t_prog = ease_out_cubic(min(1.0, max(0.0, (sec - 0.4) / 0.8)))
    t_y = int(280 + (1.0 - t_prog) * 40)
    
    # Pill
    pill_text = "SHEPEMA"
    pbbox = font_pill.getbbox(pill_text)
    pw = pbbox[2] - pbbox[0] + 70
    pill_x = int(WIDTH / 2 - pw / 2)
    draw.rounded_rectangle([pill_x, t_y, pill_x + pw, t_y + 44], radius=22, fill=BRAND_GREEN_LIGHT, outline=BRAND_GREEN, width=1)
    draw.text((pill_x + 14, t_y + 11), "✦", fill=BRAND_GREEN, font=font_sym_sm)
    draw.text((pill_x + 36, t_y + 11), pill_text, fill=BRAND_GREEN, font=font_pill)
    draw.text((pill_x + pw - 24, t_y + 11), "✦", fill=BRAND_GREEN, font=font_sym_sm)
    
    # Headline
    title_text = "Your Daily Devotional Buddy"
    bbox = font_hero.getbbox(title_text)
    tw = bbox[2] - bbox[0]
    draw.text((int(WIDTH / 2 - tw / 2), t_y + 65), title_text, fill=INK_PRIMARY, font=font_hero)
    
    # Subtitle
    sub_text = "Simple  •  Quiet  •  Works 100% Offline"
    s_bbox = font_subtitle.getbbox(sub_text)
    sw = s_bbox[2] - s_bbox[0]
    draw.text((int(WIDTH / 2 - sw / 2), t_y + 140), sub_text, fill=INK_SECONDARY, font=font_subtitle)
    
    # Bottom Badges
    b_prog = ease_out_cubic(min(1.0, max(0.0, (sec - 1.0) / 0.8)))
    if b_prog > 0:
        badges = ["Complete Bible", "Easy Journal", "Free & Offline", "No Ads"]
        by = int(1140 + (1.0 - b_prog) * 40)
        for i, b in enumerate(badges):
            row = i // 2
            col = i % 2
            cur_x = int(WIDTH / 2 - 250 + col * 260)
            cur_y = by + row * 64
            draw.rounded_rectangle([cur_x, cur_y, cur_x + 240, cur_y + 50], radius=25, fill=CARD_BG, outline=CARD_BORDER, width=1)
            draw.text((cur_x + 20, cur_y + 14), "✦", fill=BRAND_GREEN, font=font_sym_sm)
            draw.text((cur_x + 44, cur_y + 13), b, fill=INK_PRIMARY, font=font_badge)
            
    return canvas

# Render Scene 2 (Vertical): Daily Walk (5.5s)
def render_v_scene_2(frame_idx, total_f):
    sec = frame_idx / FPS
    canvas = get_vertical_base_bg(frame_idx)
    draw = ImageDraw.Draw(canvas)
    
    t_prog = ease_out_cubic(min(1.0, sec / 0.8))
    t_y = int(120 - (1.0 - t_prog) * 40)
    
    pill_text = "DAILY WALK"
    pbbox = font_pill.getbbox(pill_text)
    pw = pbbox[2] - pbbox[0] + 56
    pill_x = int(WIDTH / 2 - pw / 2)
    draw.rounded_rectangle([pill_x, t_y, pill_x + pw, t_y + 40], radius=20, fill=BRAND_GOLD_LIGHT, outline=BRAND_GOLD, width=1)
    draw.text((pill_x + 14, t_y + 9), "✦", fill=BRAND_GOLD, font=font_sym_sm)
    draw.text((pill_x + 36, t_y + 10), pill_text, fill=BRAND_GOLD, font=font_pill)
    
    # Title
    t1 = "Start Every Day in Peace"
    bbox = font_title.getbbox(t1)
    tw = bbox[2] - bbox[0]
    draw.text((int(WIDTH / 2 - tw / 2), t_y + 55), t1, fill=INK_PRIMARY, font=font_title)
    
    # Subtitle
    sub = "Daily Bible verse & habit streaks to keep you close to God."
    sbbox = font_subtitle.getbbox(sub)
    sw = sbbox[2] - sbbox[0]
    draw.text((int(WIDTH / 2 - sw / 2), t_y + 120), sub, fill=INK_SECONDARY, font=font_subtitle)
    
    # Center Phone Mockup
    phone_prog = ease_out_cubic(min(1.0, sec / 0.9))
    bob_y = math.sin(sec * 2.8) * 10
    phone_y = int(980 + (1.0 - phone_prog) * 120 + bob_y)
    draw_phone_v(canvas, phone_cache_v.get('dash'), int(WIDTH / 2), phone_y, scale=0.98)
    
    # Floating Highlight Pill at bottom
    if sec > 0.8:
        c_prog = ease_out_cubic(min(1.0, (sec - 0.8) / 0.6))
        cy = int(1640 + (1.0 - c_prog) * 30)
        cw = 620
        cx = int(WIDTH / 2 - cw / 2)
        draw.rounded_rectangle([cx + 2, cy + 4, cx + cw + 2, cy + 58 + 4], radius=29, fill=(40, 30, 20, 20))
        draw.rounded_rectangle([cx, cy, cx + cw, cy + 58], radius=29, fill=CARD_BG, outline=CARD_BORDER, width=1)
        draw.text((cx + 26, cy + 18), "✓", fill=BRAND_GREEN, font=font_sym_md)
        draw.text((cx + 60, cy + 16), "Daily Verse of the Day  •  7-Day Streak Tracker", fill=INK_PRIMARY, font=font_badge)
        
    return canvas

# Render Scene 3 (Vertical): Offline Scripture (6.0s)
def render_v_scene_3(frame_idx, total_f):
    sec = frame_idx / FPS
    canvas = get_vertical_base_bg(frame_idx)
    draw = ImageDraw.Draw(canvas)
    
    t_prog = ease_out_cubic(min(1.0, sec / 0.8))
    t_y = int(120 - (1.0 - t_prog) * 40)
    
    pill_text = "HOLY SCRIPTURE"
    pbbox = font_pill.getbbox(pill_text)
    pw = pbbox[2] - pbbox[0] + 56
    pill_x = int(WIDTH / 2 - pw / 2)
    draw.rounded_rectangle([pill_x, t_y, pill_x + pw, t_y + 40], radius=20, fill=BRAND_GREEN_LIGHT, outline=BRAND_GREEN, width=1)
    draw.text((pill_x + 14, t_y + 9), "✦", fill=BRAND_GREEN, font=font_sym_sm)
    draw.text((pill_x + 36, t_y + 10), pill_text, fill=BRAND_GREEN, font=font_pill)
    
    # Title
    t1 = "Read Anywhere Offline"
    bbox = font_title.getbbox(t1)
    tw = bbox[2] - bbox[0]
    draw.text((int(WIDTH / 2 - tw / 2), t_y + 55), t1, fill=INK_PRIMARY, font=font_title)
    
    # Subtitle
    sub = "Highlight scriptures & download translations with zero wifi."
    sbbox = font_subtitle.getbbox(sub)
    sw = sbbox[2] - sbbox[0]
    draw.text((int(WIDTH / 2 - sw / 2), t_y + 120), sub, fill=INK_SECONDARY, font=font_subtitle)
    
    # Center Phone Mockup
    phone_prog = ease_out_cubic(min(1.0, sec / 0.9))
    bob_y = math.sin(sec * 2.8 + 1.0) * 10
    phone_y = int(980 + (1.0 - phone_prog) * 120 + bob_y)
    
    if sec < 3.0:
        draw_phone_v(canvas, phone_cache_v.get('bible'), int(WIDTH / 2), phone_y, scale=0.98)
    else:
        draw_phone_v(canvas, phone_cache_v.get('offline'), int(WIDTH / 2), phone_y, scale=0.98)
        
    # Floating Highlight Pill at bottom
    if sec > 0.8:
        c_prog = ease_out_cubic(min(1.0, (sec - 0.8) / 0.6))
        cy = int(1640 + (1.0 - c_prog) * 30)
        cw = 620
        cx = int(WIDTH / 2 - cw / 2)
        draw.rounded_rectangle([cx + 2, cy + 4, cx + cw + 2, cy + 58 + 4], radius=29, fill=(40, 30, 20, 20))
        draw.rounded_rectangle([cx, cy, cx + cw, cy + 58], radius=29, fill=CARD_BG, outline=CARD_BORDER, width=1)
        draw.text((cx + 26, cy + 18), "✦", fill=BRAND_GOLD, font=font_sym_md)
        draw.text((cx + 60, cy + 16), "KJV, NLT, NIV, ESV, NKJV  •  Color Highlights", fill=INK_PRIMARY, font=font_badge)
        
    return canvas

# Render Scene 4 (Vertical): R.R.M.A. Journal (5.4s)
def render_v_scene_4(frame_idx, total_f):
    sec = frame_idx / FPS
    canvas = get_vertical_base_bg(frame_idx)
    draw = ImageDraw.Draw(canvas)
    
    t_prog = ease_out_cubic(min(1.0, sec / 0.8))
    t_y = int(120 - (1.0 - t_prog) * 40)
    
    pill_text = "DAILY JOURNAL"
    pbbox = font_pill.getbbox(pill_text)
    pw = pbbox[2] - pbbox[0] + 56
    pill_x = int(WIDTH / 2 - pw / 2)
    draw.rounded_rectangle([pill_x, t_y, pill_x + pw, t_y + 40], radius=20, fill=BRAND_TERRA_LIGHT, outline=BRAND_TERRA, width=1)
    draw.text((pill_x + 14, t_y + 9), "✦", fill=BRAND_TERRA, font=font_sym_sm)
    draw.text((pill_x + 36, t_y + 10), pill_text, fill=BRAND_TERRA, font=font_pill)
    
    # Title
    t1 = "Write What God Tells You"
    bbox = font_title.getbbox(t1)
    tw = bbox[2] - bbox[0]
    draw.text((int(WIDTH / 2 - tw / 2), t_y + 55), t1, fill=INK_PRIMARY, font=font_title)
    
    # Subtitle
    sub = "Simple 4-step guide: Rhema, Reflection, Motivation, Application."
    sbbox = font_subtitle.getbbox(sub)
    sw = sbbox[2] - sbbox[0]
    draw.text((int(WIDTH / 2 - sw / 2), t_y + 120), sub, fill=INK_SECONDARY, font=font_subtitle)
    
    # Center Phone Mockup
    phone_prog = ease_out_cubic(min(1.0, sec / 0.9))
    bob_y = math.sin(sec * 2.8) * 10
    phone_y = int(980 + (1.0 - phone_prog) * 120 + bob_y)
    
    if sec < 2.7:
        draw_phone_v(canvas, phone_cache_v.get('cover'), int(WIDTH / 2), phone_y, scale=0.98)
    else:
        draw_phone_v(canvas, phone_cache_v.get('folio'), int(WIDTH / 2), phone_y, scale=0.98)
        
    # Floating Highlight Pill at bottom
    if sec > 0.8:
        c_prog = ease_out_cubic(min(1.0, (sec - 0.8) / 0.6))
        cy = int(1640 + (1.0 - c_prog) * 30)
        cw = 620
        cx = int(WIDTH / 2 - cw / 2)
        draw.rounded_rectangle([cx + 2, cy + 4, cx + cw + 2, cy + 58 + 4], radius=29, fill=(40, 30, 20, 20))
        draw.rounded_rectangle([cx, cy, cx + cw, cy + 58], radius=29, fill=CARD_BG, outline=CARD_BORDER, width=1)
        draw.text((cx + 26, cy + 18), "✓", fill=BRAND_TERRA, font=font_sym_md)
        draw.text((cx + 60, cy + 16), "Digital Leather Journal  •  R.R.M.A. Method", fill=INK_PRIMARY, font=font_badge)
        
    return canvas

# Render Scene 5 (Vertical): Share & Reminders (5.5s)
def render_v_scene_5(frame_idx, total_f):
    sec = frame_idx / FPS
    canvas = get_vertical_base_bg(frame_idx)
    draw = ImageDraw.Draw(canvas)
    
    t_prog = ease_out_cubic(min(1.0, sec / 0.8))
    t_y = int(120 - (1.0 - t_prog) * 40)
    
    pill_text = "SHARE & REMINDERS"
    pbbox = font_pill.getbbox(pill_text)
    pw = pbbox[2] - pbbox[0] + 56
    pill_x = int(WIDTH / 2 - pw / 2)
    draw.rounded_rectangle([pill_x, t_y, pill_x + pw, t_y + 40], radius=20, fill=BRAND_GOLD_LIGHT, outline=BRAND_GOLD, width=1)
    draw.text((pill_x + 14, t_y + 9), "✦", fill=BRAND_GOLD, font=font_sym_sm)
    draw.text((pill_x + 36, t_y + 10), pill_text, fill=BRAND_GOLD, font=font_pill)
    
    # Title
    t1 = "Share & Never Forget"
    bbox = font_title.getbbox(t1)
    tw = bbox[2] - bbox[0]
    draw.text((int(WIDTH / 2 - tw / 2), t_y + 55), t1, fill=INK_PRIMARY, font=font_title)
    
    # Subtitle
    sub = "Make aesthetic cards & set quiet morning and evening alarms."
    sbbox = font_subtitle.getbbox(sub)
    sw = sbbox[2] - sbbox[0]
    draw.text((int(WIDTH / 2 - sw / 2), t_y + 120), sub, fill=INK_SECONDARY, font=font_subtitle)
    
    # Center Phone Mockup
    phone_prog = ease_out_cubic(min(1.0, sec / 0.9))
    bob_y = math.sin(sec * 2.8 + 1.0) * 10
    phone_y = int(980 + (1.0 - phone_prog) * 120 + bob_y)
    
    if sec < 2.8:
        draw_phone_v(canvas, phone_cache_v.get('card'), int(WIDTH / 2), phone_y, scale=0.98)
    else:
        draw_phone_v(canvas, phone_cache_v.get('reminders'), int(WIDTH / 2), phone_y, scale=0.98)
        
    # Floating Highlight Pill at bottom
    if sec > 0.8:
        c_prog = ease_out_cubic(min(1.0, (sec - 0.8) / 0.6))
        cy = int(1640 + (1.0 - c_prog) * 30)
        cw = 620
        cx = int(WIDTH / 2 - cw / 2)
        draw.rounded_rectangle([cx + 2, cy + 4, cx + cw + 2, cy + 58 + 4], radius=29, fill=(40, 30, 20, 20))
        draw.rounded_rectangle([cx, cy, cx + cw, cy + 58], radius=29, fill=CARD_BG, outline=CARD_BORDER, width=1)
        draw.text((cx + 26, cy + 18), "★", fill=BRAND_GOLD, font=font_sym_md)
        draw.text((cx + 60, cy + 16), "3 Aesthetic Card Styles  •  Custom Reminder Alarms", fill=INK_PRIMARY, font=font_badge)
        
    return canvas

# Render Scene 6 (Vertical): Outro & Download Link (5.8s)
def render_v_scene_6(frame_idx, total_f):
    sec = frame_idx / FPS
    canvas = get_vertical_base_bg(frame_idx)
    draw = ImageDraw.Draw(canvas)
    
    pop_prog = ease_out_back(min(1.0, sec / 1.0))
    scale = 0.85 + pop_prog * 0.15
    
    # Top Mascot
    if mascot_cozy:
        m_w = int(280 * scale)
        m_h = int(280 * scale)
        m_img = mascot_cozy.resize((m_w, m_h), Image.Resampling.LANCZOS)
        canvas.paste(m_img, (int(WIDTH / 2 - m_w / 2), int(150 + (1.0 - pop_prog) * 50)), m_img)
        
    # Main Headline
    t_prog = ease_out_cubic(min(1.0, max(0.0, (sec - 0.3) / 0.8)))
    t_y = int(450 + (1.0 - t_prog) * 30)
    headline = "Get Shepema Free"
    bbox = font_hero.getbbox(headline)
    tw = bbox[2] - bbox[0]
    draw.text((int(WIDTH / 2 - tw / 2), t_y), headline, fill=INK_PRIMARY, font=font_hero)
    
    # Badges Row
    badge_items = ["100% Free", "Works Offline", "No Ads", "Private"]
    bx = int(WIDTH / 2 - 420)
    by = t_y + 75
    for i, item in enumerate(badge_items):
        cur_x = bx + i * 215
        draw.text((cur_x, by), "✦", fill=BRAND_GREEN, font=font_sym_sm)
        draw.text((cur_x + 20, by - 2), item, fill=BRAND_GREEN, font=font_badge)
        
    # Center QR Card & Download Box
    cta_prog = ease_out_back(min(1.0, max(0.0, (sec - 0.8) / 0.9)))
    if cta_prog > 0:
        box_w = 880
        box_h = 760
        bx = int(WIDTH / 2 - box_w / 2)
        by = int(660 + (1.0 - cta_prog) * 60)
        
        # Blur Shadow
        s_img = Image.new('RGBA', (box_w + 60, box_h + 60), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(s_img)
        s_draw.rounded_rectangle([30, 30, box_w + 30, box_h + 30], radius=32, fill=(40, 30, 20, 35))
        s_img = s_img.filter(ImageFilter.GaussianBlur(22))
        canvas.paste(s_img, (bx - 30, by - 30 + 10), s_img)
        
        draw.rounded_rectangle([bx, by, bx + box_w, by + box_h], radius=32, fill=CARD_BG, outline=CARD_BORDER, width=2)
        
        # QR Code in center
        if qr_img:
            qr_size = 280
            qr_scaled = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
            q_box_x = int(WIDTH / 2 - (qr_size + 24) / 2)
            q_box_y = by + 45
            draw.rounded_rectangle([q_box_x, q_box_y, q_box_x + qr_size + 24, q_box_y + qr_size + 24], radius=20, fill=(255, 255, 255, 255), outline=CARD_BORDER, width=1)
            canvas.paste(qr_scaled, (q_box_x + 12, q_box_y + 12), qr_scaled)
            
            scan_txt = "Scan with phone camera to download"
            s_bb = font_card_desc.getbbox(scan_txt)
            draw.text((int(WIDTH / 2 - (s_bb[2] - s_bb[0]) / 2), q_box_y + qr_size + 34), scan_txt, fill=INK_MUTED, font=font_card_desc)
            
        # Glowing Web Link Box
        link_w = 760
        link_h = 68
        lx = int(WIDTH / 2 - link_w / 2)
        ly = by + 420
        draw.rounded_rectangle([lx, ly, lx + link_w, ly + link_h], radius=18, fill=BRAND_GREEN_LIGHT, outline=BRAND_GREEN, width=2)
        
        link_url = "https://shepema-web.vercel.app/"
        u_bb = font_url.getbbox(link_url)
        uw = u_bb[2] - u_bb[0]
        draw.text((int(WIDTH / 2 - uw / 2), ly + 14), link_url, fill=BRAND_GREEN, font=font_url)
        
        # Big Download Button
        btn_w = 760
        btn_h = 76
        btn_x = int(WIDTH / 2 - btn_w / 2)
        btn_y = by + 515
        draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], radius=24, fill=BRAND_GREEN)
        
        btn_txt = "↓   Download Shepema for Android"
        b_bb = font_card_title.getbbox(btn_txt)
        bw = b_bb[2] - b_bb[0]
        draw.text((int(WIDTH / 2 - bw / 2), btn_y + 22), btn_txt, fill=(255, 255, 255), font=font_card_title)
        
        # Bottom small specs
        foot = "100% Free  •  Offline Bible Bundled  •  v1.0.0"
        f_bb = font_card_desc.getbbox(foot)
        draw.text((int(WIDTH / 2 - (f_bb[2] - f_bb[0]) / 2), by + 620), foot, fill=INK_MUTED, font=font_card_desc)
        
    return canvas

# Main Rendering Pipeline
scenes_v = [
    (render_v_scene_1, 4.8),
    (render_v_scene_2, 5.5),
    (render_v_scene_3, 6.0),
    (render_v_scene_4, 5.4),
    (render_v_scene_5, 5.5),
    (render_v_scene_6, 5.8),
]

def generate_vertical_video():
    total_duration = sum(d for _, d in scenes_v)
    total_frames = int(total_duration * FPS)
    print(f"Total duration: {total_duration:.2f}s, Total frames: {total_frames}")
    
    out_video_path = r'c:\xampp\htdocs\shepema-web\public\videos\shepema_promo_9x16.mp4'
    audio_path = r'c:\xampp\htdocs\shepema-web\scratch\final_promo_audio_v.wav'
    
    cmd = [
        ffmpeg, '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-s', f'{WIDTH}x{HEIGHT}',
        '-pix_fmt', 'rgb24',
        '-r', str(FPS),
        '-i', '-',
        '-i', audio_path,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '18',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-shortest',
        out_video_path
    ]
    
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    
    global_frame = 0
    for scene_idx, (scene_func, duration) in enumerate(scenes_v):
        scene_frames = int(duration * FPS)
        print(f"Rendering Vertical Scene {scene_idx + 1}/{len(scenes_v)} ({scene_frames} frames)...")
        for f in range(scene_frames):
            frame_img = scene_func(f, scene_frames)
            rgb_bytes = frame_img.convert('RGB').tobytes()
            proc.stdin.write(rgb_bytes)
            global_frame += 1
            if global_frame % 60 == 0:
                print(f"  Frame {global_frame}/{total_frames} ({global_frame/total_frames*100:.1f}%)")
                
    proc.stdin.close()
    proc.wait()
    print(f"Vertical 9:16 Promo video successfully generated and saved to: {out_video_path}")

if __name__ == '__main__':
    generate_vertical_video()
