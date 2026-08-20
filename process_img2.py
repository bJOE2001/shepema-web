from PIL import Image
from collections import deque
import math

def remove_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    pixels = img.load()
    
    samples = [
        pixels[0, 0], pixels[w-1, 0], pixels[0, h-1], pixels[w-1, h-1],
        pixels[4, 4], pixels[w-5, 4], pixels[4, h-5], pixels[w-5, h-5]
    ]
    bg_r = sum(s[0] for s in samples) / len(samples)
    bg_g = sum(s[1] for s in samples) / len(samples)
    bg_b = sum(s[2] for s in samples) / len(samples)
    print(f"[{input_path}] BG RGB: {bg_r:.1f}, {bg_g:.1f}, {bg_b:.1f}")
    
    def color_dist(p):
        return math.sqrt((p[0] - bg_r)**2 + (p[1] - bg_g)**2 + (p[2] - bg_b)**2)
    
    low_thresh = 15.0
    high_thresh = 40.0
    
    visited = [[False] * w for _ in range(h)]
    queue = deque()
    
    for x in range(w):
        if color_dist(pixels[x, 0]) < high_thresh:
            queue.append((x, 0))
            visited[0][x] = True
        if color_dist(pixels[x, h-1]) < high_thresh:
            queue.append((x, h-1))
            visited[h-1][x] = True
            
    for y in range(h):
        if color_dist(pixels[0, y]) < high_thresh:
            queue.append((0, y))
            visited[y][0] = True
        if color_dist(pixels[w-1, y]) < high_thresh:
            queue.append((w-1, y))
            visited[y][w-1] = True
            
    while queue:
        cx, cy = queue.popleft()
        for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx]:
                if color_dist(pixels[nx, ny]) < high_thresh:
                    visited[ny][nx] = True
                    queue.append((nx, ny))
                    
    for y in range(h):
        for x in range(w):
            if visited[y][x]:
                d = color_dist(pixels[x, y])
                r, g, b, a = pixels[x, y]
                if d <= low_thresh:
                    pixels[x, y] = (r, g, b, 0)
                else:
                    alpha_ratio = (d - low_thresh) / (high_thresh - low_thresh)
                    pixels[x, y] = (r, g, b, int(alpha_ratio * 255))
                    
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

remove_background(
    r"c:\xampp\htdocs\shepema-web\public\images\mascot-writing-journal.jpg",
    r"c:\xampp\htdocs\shepema-web\public\images\mascot-writing-journal-transparent.png"
)
remove_background(
    r"c:\xampp\htdocs\shepema-web\public\images\mascot-holding-bible.jpg",
    r"c:\xampp\htdocs\shepema-web\public\images\mascot-holding-bible-transparent.png"
)
