import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import subprocess
import imageio_ffmpeg
import qrcode

ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

WIDTH = 1920
HEIGHT = 1080
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
font_hero = ImageFont.truetype(os.path.join(FONT_DIR, 'georgiab.ttf'), 58)
font_title = ImageFont.truetype(os.path.join(FONT_DIR, 'georgiab.ttf'), 44)
font_subtitle = ImageFont.truetype(os.path.join(FONT_DIR, 'segoeui.ttf'), 22)
font_pill = ImageFont.truetype(os.path.join(FONT_DIR, 'segoeuib.ttf'), 16)
font_card_title = ImageFont.truetype(os.path.join(FONT_DIR, 'segoeuib.ttf'), 19)
font_card_desc = ImageFont.truetype(os.path.join(FONT_DIR, 'segoeui.ttf'), 16)
font_url = ImageFont.truetype(os.path.join(FONT_DIR, 'segoeuib.ttf'), 26)
font_badge = ImageFont.truetype(os.path.join(FONT_DIR, 'segoeuib.ttf'), 17)
font_sym_sm = ImageFont.truetype(os.path.join(FONT_DIR, 'seguisym.ttf'), 17)
font_sym_md = ImageFont.truetype(os.path.join(FONT_DIR, 'seguisym.ttf'), 22)
font_sym_lg = ImageFont.truetype(os.path.join(FONT_DIR, 'seguisym.ttf'), 28)

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

# Create Phone Mockup Graphic
def create_phone_frame(screen_img, target_width=390, target_height=866):
    screen_resized = screen_img.resize((target_width, target_height), Image.Resampling.LANCZOS)
    bezel = 14
    frame_w = target_width + bezel * 2
    frame_h = target_height + bezel * 2
    corner_radius = 42
    
    frame = Image.new('RGBA', (frame_w, frame_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)
    draw.rounded_rectangle([0, 0, frame_w, frame_h], radius=corner_radius, fill=(28, 30, 34, 255), outline=(65, 70, 75, 255), width=2)
    
    mask = Image.new('L', (target_width, target_height), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([0, 0, target_width, target_height], radius=corner_radius - 8, fill=255)
    
    frame.paste(screen_resized, (bezel, bezel), mask)
    
    notch_w, notch_h = 80, 18
    notch_x = (frame_w - notch_w) // 2
    notch_y = bezel + 6
    draw.rounded_rectangle([notch_x, notch_y, notch_x + notch_w, notch_y + notch_h], radius=9, fill=(12, 12, 15, 255))
    draw.ellipse([notch_x + 12, notch_y + 4, notch_x + 22, notch_y + 14], fill=(30, 40, 55, 255))
    draw.rounded_rectangle([bezel, bezel, bezel + target_width, bezel + target_height], radius=corner_radius - 8, outline=(220, 220, 220, 35), width=1)
    
    return frame

phone_cache = {}
for k, img in shots.items():
    if img:
        phone_cache[k] = create_phone_frame(img)

# Generate Base Background
def get_base_bg(frame_num):
    bg = Image.new('RGBA', (WIDTH, HEIGHT), BG_TOP)
    draw = ImageDraw.Draw(bg)
    
    for y in range(HEIGHT):
        ratio = y / HEIGHT
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * ratio)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * ratio)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * ratio)
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b, 255))
        
    t = frame_num / FPS
    orb1_x = int(WIDTH * 0.25 + math.sin(t * 0.5) * 80)
    orb1_y = int(HEIGHT * 0.35 + math.cos(t * 0.4) * 60)
    orb2_x = int(WIDTH * 0.75 + math.cos(t * 0.6) * 90)
    orb2_y = int(HEIGHT * 0.65 + math.sin(t * 0.5) * 70)
    
    orbs = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    orbs_draw = ImageDraw.Draw(orbs)
    orbs_draw.ellipse([orb1_x - 320, orb1_y - 320, orb1_x + 320, orb1_y + 320], fill=(220, 242, 228, 55))
    orbs_draw.ellipse([orb2_x - 360, orb2_y - 360, orb2_x + 360, orb2_y + 360], fill=(255, 246, 222, 60))
    
    for i in range(14):
        sp_x = int((i * 153 + t * 30) % WIDTH)
        sp_y = int((i * 87 + math.sin(t + i) * 35 + HEIGHT * 0.15) % HEIGHT)
        alpha = int((math.sin(t * 3.2 + i) + 1.0) * 0.5 * 100)
        orbs_draw.text((sp_x, sp_y), '✦', fill=(BRAND_GOLD[0], BRAND_GOLD[1], BRAND_GOLD[2], alpha), font=font_sym_sm)

    return Image.alpha_composite(bg, orbs)

# Helper: Draw Shadowed Phone
def draw_phone(canvas, phone_img, center_x, center_y, scale=1.0, rotation=0.0):
    if phone_img is None:
        return
    
    w = int(phone_img.width * scale)
    h = int(phone_img.height * scale)
    scaled_phone = phone_img.resize((w, h), Image.Resampling.LANCZOS)
    
    shadow_w = w + 80
    shadow_h = h + 80
    shadow = Image.new('RGBA', (shadow_w, shadow_h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle([40, 40, shadow_w - 40, shadow_h - 40], radius=int(44 * scale), fill=(30, 20, 12, 50))
    shadow = shadow.filter(ImageFilter.GaussianBlur(24))
    
    if rotation != 0.0:
        scaled_phone = scaled_phone.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)
        shadow = shadow.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)
        
    px = int(center_x - scaled_phone.width / 2)
    py = int(center_y - scaled_phone.height / 2)
    
    canvas.paste(shadow, (int(center_x - shadow.width / 2), int(center_y - shadow.height / 2 + 14)), shadow)
    canvas.paste(scaled_phone, (px, py), scaled_phone)

# Helper: Draw Feature Card
def draw_feature_box(draw, x, y, w, h, icon_sym, title, desc, progress=1.0, theme_color=BRAND_GREEN, theme_bg=BRAND_GREEN_LIGHT):
    if progress <= 0:
        return
    
    alpha = int(progress * 255)
    slide_offset = int((1.0 - progress) * 35)
    cur_x = x + slide_offset
    
    card_fill = (255, 255, 255, alpha)
    border_col = (CARD_BORDER[0], CARD_BORDER[1], CARD_BORDER[2], alpha)
    
    draw.rounded_rectangle([cur_x + 2, y + 4, cur_x + w + 2, y + h + 4], radius=16, fill=(40, 30, 20, int(alpha * 0.05)))
    draw.rounded_rectangle([cur_x, y, cur_x + w, y + h], radius=16, fill=card_fill, outline=border_col, width=1)
    
    circle_x = cur_x + 16
    circle_y = y + 14
    draw.rounded_rectangle([circle_x, circle_y, circle_x + 44, circle_y + 44], radius=22, fill=(theme_bg[0], theme_bg[1], theme_bg[2], alpha), outline=(theme_color[0], theme_color[1], theme_color[2], int(alpha * 0.5)), width=1)
    
    ibox = font_sym_md.getbbox(icon_sym)
    iw = ibox[2] - ibox[0]
    draw.text((circle_x + 22 - iw / 2, circle_y + 8), icon_sym, fill=(theme_color[0], theme_color[1], theme_color[2], alpha), font=font_sym_md)
    
    draw.text((cur_x + 72, y + 13), title, fill=(INK_PRIMARY[0], INK_PRIMARY[1], INK_PRIMARY[2], alpha), font=font_card_title)
    draw.text((cur_x + 72, y + 39), desc, fill=(INK_SECONDARY[0], INK_SECONDARY[1], INK_SECONDARY[2], alpha), font=font_card_desc)

# Render Scene 1: Hero Intro (4.8s)
def render_scene_1(frame_idx, total_f):
    sec = frame_idx / FPS
    canvas = get_base_bg(frame_idx)
    draw = ImageDraw.Draw(canvas)
    
    pop_prog = ease_out_back(min(1.0, sec / 1.0))
    scale = 0.85 + pop_prog * 0.15
    
    if mascot_holding:
        m_w = int(360 * scale)
        m_h = int(360 * scale)
        m_img = mascot_holding.resize((m_w, m_h), Image.Resampling.LANCZOS)
        bob_y = int(math.sin(sec * 3.5) * 8)
        canvas.paste(m_img, (int(WIDTH / 2 - m_w / 2), int(250 + (1.0 - pop_prog) * 120 + bob_y)), m_img)
        
    t_prog = ease_out_cubic(min(1.0, max(0.0, (sec - 0.4) / 0.8)))
    t_y_offset = int((1.0 - t_prog) * 40)
    
    pill_text = "SHEPEMA"
    pbbox = font_pill.getbbox(pill_text)
    pw = pbbox[2] - pbbox[0] + 64
    pill_x = int(WIDTH / 2 - pw / 2)
    pill_y = int(145 + t_y_offset)
    draw.rounded_rectangle([pill_x, pill_y, pill_x + pw, pill_y + 40], radius=20, fill=BRAND_GREEN_LIGHT, outline=BRAND_GREEN, width=1)
    draw.text((pill_x + 14, pill_y + 9), "✦", fill=BRAND_GREEN, font=font_sym_sm)
    draw.text((pill_x + 36, pill_y + 10), pill_text, fill=BRAND_GREEN, font=font_pill)
    draw.text((pill_x + pw - 24, pill_y + 9), "✦", fill=BRAND_GREEN, font=font_sym_sm)
    
    title_text = "Your Daily Devotional Buddy"
    bbox = font_hero.getbbox(title_text)
    tw = bbox[2] - bbox[0]
    draw.text((int(WIDTH / 2 - tw / 2), int(645 + t_y_offset)), title_text, fill=INK_PRIMARY, font=font_hero)
    
    sub_prog = ease_out_cubic(min(1.0, max(0.0, (sec - 0.8) / 0.8)))
    sub_y_offset = int((1.0 - sub_prog) * 30)
    sub_text = "Simple   •   Quiet   •   Works 100% Offline"
    s_bbox = font_subtitle.getbbox(sub_text)
    sw = s_bbox[2] - s_bbox[0]
    draw.text((int(WIDTH / 2 - sw / 2), int(730 + sub_y_offset)), sub_text, fill=INK_SECONDARY, font=font_subtitle)
    
    badge_prog = ease_out_cubic(min(1.0, max(0.0, (sec - 1.0) / 0.8)))
    if badge_prog > 0:
        badges = ["Complete Bible", "Easy Journal", "Free & Offline", "No Ads"]
        bx = int(WIDTH / 2 - 450)
        by = int(805 + (1.0 - badge_prog) * 30)
        for i, b in enumerate(badges):
            bw = 210
            cur_bx = bx + i * 230
            draw.rounded_rectangle([cur_bx, by, cur_bx + bw, by + 46], radius=23, fill=CARD_BG, outline=CARD_BORDER, width=1)
            draw.text((cur_bx + 18, by + 13), "✦", fill=BRAND_GREEN, font=font_sym_sm)
            draw.text((cur_bx + 38, by + 12), b, fill=INK_PRIMARY, font=font_badge)
            
    return canvas

# Render Scene 2: Daily Walk & Streaks (5.5s)
def render_scene_2(frame_idx, total_f):
    sec = frame_idx / FPS
    canvas = get_base_bg(frame_idx)
    draw = ImageDraw.Draw(canvas)
    
    t_prog = ease_out_cubic(min(1.0, sec / 0.8))
    lx = int(120 - (1.0 - t_prog) * 60)
    
    pill_text = "DAILY WALK"
    pbbox = font_pill.getbbox(pill_text)
    pw = pbbox[2] - pbbox[0] + 50
    draw.rounded_rectangle([lx, 150, lx + pw, 190], radius=20, fill=BRAND_GOLD_LIGHT, outline=BRAND_GOLD, width=1)
    draw.text((lx + 14, 159), "✦", fill=BRAND_GOLD, font=font_sym_sm)
    draw.text((lx + 34, 160), pill_text, fill=BRAND_GOLD, font=font_pill)
    
    draw.text((lx, 215), "Start Every Day in Peace", fill=INK_PRIMARY, font=font_title)
    desc = "Daily Bible verse & habit streaks to keep you close to God."
    draw.text((lx, 285), desc, fill=INK_SECONDARY, font=font_subtitle)
    
    c1 = ease_out_cubic(min(1.0, max(0.0, (sec - 0.4) / 0.6)))
    draw_feature_box(draw, lx, 365, 680, 72, "✓", "Daily Verse of the Day", "Fresh Scripture and mascot prayer every morning", c1, BRAND_GREEN, BRAND_GREEN_LIGHT)
    
    c2 = ease_out_cubic(min(1.0, max(0.0, (sec - 0.8) / 0.6)))
    draw_feature_box(draw, lx, 455, 680, 72, "★", "7-Day Habit Streak Tracker", "Stay faithful and celebrate your weekly progress", c2, BRAND_GOLD, BRAND_GOLD_LIGHT)
    
    c3 = ease_out_cubic(min(1.0, max(0.0, (sec - 1.2) / 0.6)))
    draw_feature_box(draw, lx, 545, 680, 72, "✦", "Quick Devotion Launcher", "Jump straight into prayer with one simple tap", c3, BRAND_TERRA, BRAND_TERRA_LIGHT)
    
    phone_prog = ease_out_cubic(min(1.0, sec / 0.9))
    bob_y = math.sin(sec * 2.8) * 10
    phone_x = int(1400 + (1.0 - phone_prog) * 180)
    phone_y = int(540 + bob_y)
    
    draw_phone(canvas, phone_cache.get('dash'), phone_x, phone_y, scale=0.98, rotation=-1.5)
    
    return canvas

# Render Scene 3: Scripture Reader & Offline Bibles (6.0s)
def render_scene_3(frame_idx, total_f):
    sec = frame_idx / FPS
    canvas = get_base_bg(frame_idx)
    draw = ImageDraw.Draw(canvas)
    
    phone_prog = ease_out_cubic(min(1.0, sec / 0.9))
    bob_y = math.sin(sec * 2.8 + 1.0) * 10
    phone_x = int(500 - (1.0 - phone_prog) * 180)
    phone_y = int(540 + bob_y)
    
    if sec < 3.0:
        draw_phone(canvas, phone_cache.get('bible'), phone_x, phone_y, scale=0.98, rotation=1.2)
    else:
        draw_phone(canvas, phone_cache.get('offline'), phone_x, phone_y, scale=0.98, rotation=1.2)
        
    t_prog = ease_out_cubic(min(1.0, sec / 0.8))
    rx = int(980 + (1.0 - t_prog) * 60)
    
    pill_text = "HOLY SCRIPTURE"
    pbbox = font_pill.getbbox(pill_text)
    pw = pbbox[2] - pbbox[0] + 50
    draw.rounded_rectangle([rx, 150, rx + pw, 190], radius=20, fill=BRAND_GREEN_LIGHT, outline=BRAND_GREEN, width=1)
    draw.text((rx + 14, 159), "✦", fill=BRAND_GREEN, font=font_sym_sm)
    draw.text((rx + 34, 160), pill_text, fill=BRAND_GREEN, font=font_pill)
    
    draw.text((rx, 215), "Read Anywhere Offline", fill=INK_PRIMARY, font=font_title)
    desc = "Highlight scriptures & download translations with zero wifi."
    draw.text((rx, 285), desc, fill=INK_SECONDARY, font=font_subtitle)
    
    c1 = ease_out_cubic(min(1.0, max(0.0, (sec - 0.4) / 0.6)))
    draw_feature_box(draw, rx, 365, 720, 72, "✓", "Free Bible Downloads", "KJV bundled permanently + NLT, NIV, ESV, NKJV", c1, BRAND_GREEN, BRAND_GREEN_LIGHT)
    
    c2 = ease_out_cubic(min(1.0, max(0.0, (sec - 0.8) / 0.6)))
    draw_feature_box(draw, rx, 455, 720, 72, "✦", "Color Highlighting", "Gold, green, sky & rose pens to save favorite verses", c2, BRAND_GOLD, BRAND_GOLD_LIGHT)
    
    c3 = ease_out_cubic(min(1.0, max(0.0, (sec - 1.2) / 0.6)))
    draw_feature_box(draw, rx, 545, 720, 72, "★", "One-Tap 'Make Rhema'", "Send highlighted scripture directly into your journal", c3, BRAND_TERRA, BRAND_TERRA_LIGHT)
    
    return canvas

# Render Scene 4: R.R.M.A. Devotional Journal (5.4s)
def render_scene_4(frame_idx, total_f):
    sec = frame_idx / FPS
    canvas = get_base_bg(frame_idx)
    draw = ImageDraw.Draw(canvas)
    
    t_prog = ease_out_cubic(min(1.0, sec / 0.8))
    lx = int(120 - (1.0 - t_prog) * 60)
    
    pill_text = "DAILY JOURNAL"
    pbbox = font_pill.getbbox(pill_text)
    pw = pbbox[2] - pbbox[0] + 50
    draw.rounded_rectangle([lx, 140, lx + pw, 180], radius=20, fill=BRAND_TERRA_LIGHT, outline=BRAND_TERRA, width=1)
    draw.text((lx + 14, 149), "✦", fill=BRAND_TERRA, font=font_sym_sm)
    draw.text((lx + 34, 150), pill_text, fill=BRAND_TERRA, font=font_pill)
    
    draw.text((lx, 205), "Write What God Tells You", fill=INK_PRIMARY, font=font_title)
    desc = "Simple 4-step guide: Rhema, Reflection, Motivation, Application."
    draw.text((lx, 275), desc, fill=INK_SECONDARY, font=font_subtitle)
    
    method_box_prog = ease_out_cubic(min(1.0, max(0.0, (sec - 0.4) / 0.6)))
    if method_box_prog > 0:
        bx = lx
        by = 355
        bw = 720
        bh = 295
        draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=18, fill=CARD_BG, outline=CARD_BORDER, width=1)
        
        steps = [
            ("R — RHEMA", "The spoken Scripture that touches your heart today", BRAND_TERRA, BRAND_TERRA_LIGHT),
            ("R — REFLECTION", "What is God saying to you through this passage?", BRAND_GREEN, BRAND_GREEN_LIGHT),
            ("M — MOTIVATION", "Spiritual courage, peace, and emotional strength", BRAND_GOLD, BRAND_GOLD_LIGHT),
            ("A — APPLICATION", "Practical action steps and prayer commitments", BRAND_BLUE, BRAND_BLUE_LIGHT),
        ]
        for i, (st, sd, sc, sbg) in enumerate(steps):
            sy = by + 16 + i * 68
            draw.rounded_rectangle([bx + 18, sy, bx + 195, sy + 40], radius=10, fill=sbg, outline=sc, width=1)
            draw.text((bx + 26, sy + 9), st, fill=sc, font=font_pill)
            draw.text((bx + 210, sy + 10), sd, fill=INK_SECONDARY, font=font_card_desc)
            if i < 3:
                draw.line([(bx + 18, sy + 54), (bx + bw - 18, sy + 54)], fill=CARD_BORDER, width=1)
                
    phone_prog = ease_out_cubic(min(1.0, sec / 0.9))
    bob_y = math.sin(sec * 2.8) * 10
    phone_x = int(1400 + (1.0 - phone_prog) * 180)
    phone_y = int(540 + bob_y)
    
    if sec < 2.7:
        draw_phone(canvas, phone_cache.get('cover'), phone_x, phone_y, scale=0.98, rotation=-1.5)
    else:
        draw_phone(canvas, phone_cache.get('folio'), phone_x, phone_y, scale=0.98, rotation=-1.5)
        
    return canvas

# Render Scene 5: Aesthetic Cards & Habit Reminders (5.5s)
def render_scene_5(frame_idx, total_f):
    sec = frame_idx / FPS
    canvas = get_base_bg(frame_idx)
    draw = ImageDraw.Draw(canvas)
    
    phone_prog = ease_out_cubic(min(1.0, sec / 0.9))
    bob_y = math.sin(sec * 2.8 + 1.0) * 10
    phone_x = int(500 - (1.0 - phone_prog) * 180)
    phone_y = int(540 + bob_y)
    
    if sec < 2.8:
        draw_phone(canvas, phone_cache.get('card'), phone_x, phone_y, scale=0.98, rotation=1.2)
    else:
        draw_phone(canvas, phone_cache.get('reminders'), phone_x, phone_y, scale=0.98, rotation=1.2)
        
    t_prog = ease_out_cubic(min(1.0, sec / 0.8))
    rx = int(980 + (1.0 - t_prog) * 60)
    
    pill_text = "SHARE & REMINDERS"
    pbbox = font_pill.getbbox(pill_text)
    pw = pbbox[2] - pbbox[0] + 50
    draw.rounded_rectangle([rx, 150, rx + pw, 190], radius=20, fill=BRAND_GOLD_LIGHT, outline=BRAND_GOLD, width=1)
    draw.text((rx + 14, 159), "✦", fill=BRAND_GOLD, font=font_sym_sm)
    draw.text((rx + 34, 160), pill_text, fill=BRAND_GOLD, font=font_pill)
    
    draw.text((rx, 215), "Share & Never Forget", fill=INK_PRIMARY, font=font_title)
    desc = "Make aesthetic cards & set quiet morning and evening alarms."
    draw.text((rx, 285), desc, fill=INK_SECONDARY, font=font_subtitle)
    
    c1 = ease_out_cubic(min(1.0, max(0.0, (sec - 0.4) / 0.6)))
    draw_feature_box(draw, rx, 365, 720, 72, "✦", "Aesthetic Verse Share Cards", "Classic Paper, Clean Modern & Midnight Onyx styles", c1, BRAND_GOLD, BRAND_GOLD_LIGHT)
    
    c2 = ease_out_cubic(min(1.0, max(0.0, (sec - 0.8) / 0.6)))
    draw_feature_box(draw, rx, 455, 720, 72, "★", "Custom Reminder Alarms", "Morning devotion & evening reflection time scheduler", c2, BRAND_GREEN, BRAND_GREEN_LIGHT)
    
    c3 = ease_out_cubic(min(1.0, max(0.0, (sec - 1.2) / 0.6)))
    draw_feature_box(draw, rx, 545, 720, 72, "✓", "Biometric Privacy & No Ads", "Fingerprint lock, offline storage, zero advertising", c3, BRAND_TERRA, BRAND_TERRA_LIGHT)
    
    return canvas

# Render Scene 6: Outro & Call to Action (5.8s)
def render_scene_6(frame_idx, total_f):
    sec = frame_idx / FPS
    canvas = get_base_bg(frame_idx)
    draw = ImageDraw.Draw(canvas)
    
    pop_prog = ease_out_back(min(1.0, sec / 1.0))
    scale = 0.85 + pop_prog * 0.15
    
    if mascot_cozy:
        m_w = int(220 * scale)
        m_h = int(220 * scale)
        m_img = mascot_cozy.resize((m_w, m_h), Image.Resampling.LANCZOS)
        canvas.paste(m_img, (int(WIDTH / 2 - m_w / 2), int(70 + (1.0 - pop_prog) * 40)), m_img)
        
    t_prog = ease_out_cubic(min(1.0, max(0.0, (sec - 0.3) / 0.8)))
    t_y = int(305 + (1.0 - t_prog) * 30)
    headline = "Get Shepema Free"
    bbox = font_hero.getbbox(headline)
    tw = bbox[2] - bbox[0]
    draw.text((int(WIDTH / 2 - tw / 2), t_y), headline, fill=INK_PRIMARY, font=font_hero)
    
    b_prog = ease_out_cubic(min(1.0, max(0.0, (sec - 0.6) / 0.8)))
    if b_prog > 0:
        badge_items = ["100% Free", "Works Offline", "No Ads", "Private"]
        bx = int(WIDTH / 2 - 420)
        by = t_y + 75
        for i, item in enumerate(badge_items):
            cur_x = bx + i * 215
            draw.text((cur_x, by), "✦", fill=BRAND_GREEN, font=font_sym_sm)
            draw.text((cur_x + 20, by - 2), item, fill=BRAND_GREEN, font=font_badge)
            if i < 3:
                draw.text((cur_x + 195, by - 2), "•", fill=BRAND_GREEN, font=font_badge)
        
    cta_prog = ease_out_back(min(1.0, max(0.0, (sec - 0.8) / 0.9)))
    if cta_prog > 0:
        box_w = 1040
        box_h = 240
        bx = int(WIDTH / 2 - box_w / 2)
        by = int(480 + (1.0 - cta_prog) * 50)
        
        s_img = Image.new('RGBA', (box_w + 60, box_h + 60), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(s_img)
        s_draw.rounded_rectangle([30, 30, box_w + 30, box_h + 30], radius=24, fill=(40, 30, 20, 35))
        s_img = s_img.filter(ImageFilter.GaussianBlur(18))
        canvas.paste(s_img, (bx - 30, by - 30 + 10), s_img)
        
        draw.rounded_rectangle([bx, by, bx + box_w, by + box_h], radius=24, fill=CARD_BG, outline=CARD_BORDER, width=2)
        
        if qr_img:
            qr_size = 164
            qr_scaled = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
            draw.rounded_rectangle([bx + 30, by + 26, bx + 30 + qr_size + 16, by + 26 + qr_size + 16], radius=14, fill=(255, 255, 255, 255), outline=CARD_BORDER, width=1)
            canvas.paste(qr_scaled, (bx + 38, by + 34), qr_scaled)
            draw.text((bx + 54, by + 26 + qr_size + 24), "Scan to visit", fill=INK_MUTED, font=font_card_desc)
            
        rx = bx + 250
        draw.text((rx, by + 28), "Download Shepema for Android", fill=INK_PRIMARY, font=font_title)
        
        link_w = 740
        link_h = 56
        ly = by + 94
        draw.rounded_rectangle([rx, ly, rx + link_w, ly + link_h], radius=14, fill=BRAND_GREEN_LIGHT, outline=BRAND_GREEN, width=2)
        draw.text((rx + 22, ly + 14), "🔗", fill=BRAND_GREEN, font=font_sym_md)
        draw.text((rx + 58, ly + 11), "https://shepema-web.vercel.app/", fill=BRAND_GREEN, font=font_url)
        
        draw.rounded_rectangle([rx, by + 168, rx + 280, by + 212], radius=22, fill=BRAND_GREEN)
        draw.text((rx + 28, by + 178), "↓", fill=(255, 255, 255), font=font_sym_sm)
        draw.text((rx + 48, by + 179), "Download APK (Free)", fill=(255, 255, 255), font=font_pill)
        draw.text((rx + 305, by + 182), "v1.0.0 • Offline Bible Included • No Ads", fill=INK_MUTED, font=font_card_desc)
        
    return canvas

# Main Rendering Pipeline
scenes = [
    (render_scene_1, 4.8),
    (render_scene_2, 5.5),
    (render_scene_3, 6.0),
    (render_scene_4, 5.4),
    (render_scene_5, 5.5),
    (render_scene_6, 5.8),
]

def generate_video():
    total_duration = sum(d for _, d in scenes)
    total_frames = int(total_duration * FPS)
    print(f"Total duration: {total_duration:.2f}s, Total frames: {total_frames}")
    
    out_video_path = r'c:\xampp\htdocs\shepema-web\public\videos\shepema_promo_video.mp4'
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
    for scene_idx, (scene_func, duration) in enumerate(scenes):
        scene_frames = int(duration * FPS)
        print(f"Rendering Scene {scene_idx + 1}/{len(scenes)} ({scene_frames} frames)...")
        for f in range(scene_frames):
            frame_img = scene_func(f, scene_frames)
            rgb_bytes = frame_img.convert('RGB').tobytes()
            proc.stdin.write(rgb_bytes)
            global_frame += 1
            if global_frame % 60 == 0:
                print(f"  Frame {global_frame}/{total_frames} ({global_frame/total_frames*100:.1f}%)")
                
    proc.stdin.close()
    proc.wait()
    print(f"Promo video successfully generated and saved to: {out_video_path}")

if __name__ == '__main__':
    generate_video()
