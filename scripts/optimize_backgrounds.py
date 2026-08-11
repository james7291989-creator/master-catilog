import os
from PIL import Image, ImageEnhance, ImageOps

PUBLIC = os.path.join(os.path.dirname(__file__), '..', 'public')

def bake(img):
    img = ImageOps.grayscale(img).convert('RGB')
    img = ImageEnhance.Contrast(img).enhance(1.2)
    img = ImageEnhance.Brightness(img).enhance(0.4)
    return img

def opt(path, fmt, q, max_dim=1920):
    name = os.path.basename(path)
    img = Image.open(path)
    print(f"{name}: {os.path.getsize(path)/1024:.1f}KB {img.size}")
    img = bake(img)
    if max(img.size) > max_dim:
        r = max_dim / max(img.size)
        img = img.resize((int(img.size[0]*r), int(img.size[1]*r)), Image.LANCZOS)
    img.save(path, fmt, quality=q, optimize=True)
    print(f"{name}: -> {os.path.getsize(path)/1024:.1f}KB")
    return img

# Bake the original images EXACTLY ONCE (filters baked into pixels)
hero_baked = opt(os.path.join(PUBLIC, 'bg.jpg'), 'JPEG', 70)
opt(os.path.join(PUBLIC, 'hero-bg.webp'), 'WEBP', 70)

# ⚡ V24 MOBILE VARIANT: ultra-light for 4G phones, served via CSS media query
hero_mobile = os.path.join(PUBLIC, 'hero-bg-mobile.webp')
img = Image.open(os.path.join(PUBLIC, 'hero-bg.webp'))
mobile = img.resize((1080, int(1080 * img.size[1] / img.size[0])), Image.LANCZOS)
mobile.save(hero_mobile, 'WEBP', quality=65, optimize=True)
print(f"hero-bg-mobile.webp: -> {os.path.getsize(hero_mobile)/1024:.1f}KB {mobile.size}")