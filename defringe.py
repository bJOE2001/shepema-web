from PIL import Image
from collections import deque
import math

# 1. Defringe mascot-holding-bible-transparent.png
img = Image.open(r"c:\xampp\htdocs\shepema-web\public\images\mascot-holding-bible-transparent.png").convert("RGBA")
w, h = img.size
pixels = img.load()

# Blue defringe: any pixel where blue channel is dominant or has blue chroma near transparent edges
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if a > 0:
            # Check if it has a blueish tint from the old blue background
            # The character only has green sweater, reddish bible, pink ears, cream wool, black hooves/glasses/eyes.
            # There is ZERO legitimate blue on the sheep character.
            if b > 100 and b > r * 1.1 and b > g:
                # This is blue background fringe
                pixels[x, y] = (r, g, b, 0)
            elif b > 70 and (b - r > 20) and (b - g > 15):
                # Semi-transparent blue fringe -> make transparent
                pixels[x, y] = (r, g, b, 0)

# Also erode/clean edge semi-transparent pixels with blue bias
img.save(r"c:\xampp\htdocs\shepema-web\public\images\mascot-holding-bible-defringed.png", "PNG")
print("Saved mascot-holding-bible-defringed.png")

# 2. Also create transparent version of mascot-glowing-bible.jpg as an alternative
img2 = Image.open(r"c:\xampp\htdocs\shepema-web\public\images\mascot-glowing-bible.jpg").convert("RGBA")
w2, h2 = img2.size
pixels2 = img2.load()

samples = [
    pixels2[0, 0], pixels2[w2-1, 0], pixels2[0, h2-1], pixels2[w2-1, h2-1],
    pixels2[4, 4], pixels2[w2-5, 4], pixels2[4, h2-5], pixels2[w2-5, h2-5]
]
bg_r = sum(s[0] for s in samples) / len(samples)
bg_g = sum(s[1] for s in samples) / len(samples)
bg_b = sum(s[2] for s in samples) / len(samples)

def color_dist2(p):
    return math.sqrt((p[0] - bg_r)**2 + (p[1] - bg_g)**2 + (p[2] - bg_b)**2)

low_thresh = 15.0
high_thresh = 38.0

visited = [[False] * w2 for _ in range(h2)]
queue = deque()

for x in range(w2):
    if color_dist2(pixels2[x, 0]) < high_thresh:
        queue.append((x, 0))
        visited[0][x] = True
    if color_dist2(pixels2[x, h2-1]) < high_thresh:
        queue.append((x, h2-1))
        visited[h2-1][x] = True
        
for y in range(h2):
    if color_dist2(pixels2[0, y]) < high_thresh:
        queue.append((0, y))
        visited[y][0] = True
    if color_dist2(pixels2[w2-1, y]) < high_thresh:
        queue.append((w2-1, y))
        visited[y][w2-1] = True
        
while queue:
    cx, cy = queue.popleft()
    for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
        nx, ny = cx + dx, cy + dy
        if 0 <= nx < w2 and 0 <= ny < h2 and not visited[ny][nx]:
            if color_dist2(pixels2[nx, ny]) < high_thresh:
                visited[ny][nx] = True
                queue.append((nx, ny))
                
for y in range(h2):
    for x in range(w2):
        if visited[y][x]:
            d = color_dist2(pixels2[x, y])
            r, g, b, a = pixels2[x, y]
            if d <= low_thresh:
                pixels2[x, y] = (r, g, b, 0)
            else:
                alpha_ratio = (d - low_thresh) / (high_thresh - low_thresh)
                pixels2[x, y] = (r, g, b, int(alpha_ratio * 255))
                
img2.save(r"c:\xampp\htdocs\shepema-web\public\images\mascot-glowing-bible-transparent.png", "PNG")
print("Saved mascot-glowing-bible-transparent.png")
