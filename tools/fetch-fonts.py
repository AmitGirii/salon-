"""Downloads the latin woff2 files for the site's two families from Google Fonts
and writes src/styles/fonts.css with matching @font-face rules."""
import io, os, re, urllib.request

ROOT = r"D:/curt n curl salon"
CSS_URL = ("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400"
           "&family=Manrope:wght@400;500;600&family=Jost:wght@300;400;500&display=swap")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"

req = urllib.request.Request(CSS_URL, headers={"User-Agent": UA})
css = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")

blocks = re.findall(r"/\* (\w+) \*/\s*@font-face\s*\{(.*?)\}", css, re.S)
out_dir = os.path.join(ROOT, "public", "fonts")
os.makedirs(out_dir, exist_ok=True)
faces = []
for subset, body in blocks:
    if subset != "latin":
        continue
    family = re.search(r"font-family:\s*'([^']+)'", body).group(1)
    style = re.search(r"font-style:\s*(\w+)", body).group(1)
    weight = re.search(r"font-weight:\s*(\d+)", body).group(1)
    url = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
    urange = re.search(r"unicode-range:\s*([^;]+);", body).group(1).strip()
    slug = family.lower().replace(" ", "-")
    name = f"{slug}-{weight}{'-italic' if style == 'italic' else ''}.woff2"
    data = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read()
    io.open(os.path.join(out_dir, name), "wb").write(data)
    faces.append((family, style, weight, name, urange, len(data)))
    print(f"{name:40s} {len(data)/1024:6.1f} KB")

lines = ["/*", " * Self-hosted web fonts (latin subset), served from /fonts/.", " *",
         " * They used to come from Google Fonts. Loading them from the same origin,",
         " * with the four faces the first screen needs preloaded in index.html, means",
         " * the browser lays the page out ONCE with the real fonts instead of once",
         " * with a fallback and again when each family arrives — and on a phone that",
         " * second, page-wide reflow was the single longest task of the whole load.",
         " * It also removes two third-party connections and the CSP entries for them.",
         " *", " * Files fetched by tools/fetch-fonts.py (Cormorant Garamond and Manrope are",
         " * both under the SIL Open Font License).", " */", ""]
for family, style, weight, name, urange, _ in faces:
    lines += ["@font-face {", f"  font-family: '{family}';", f"  font-style: {style};", f"  font-weight: {weight};",
              "  font-display: swap;", f"  src: url('/fonts/{name}') format('woff2');", f"  unicode-range: {urange};", "}", ""]
io.open(os.path.join(ROOT, "src", "styles", "fonts.css"), "w", encoding="utf-8", newline="\n").write("\n".join(lines))
print("wrote src/styles/fonts.css with", len(faces), "faces; total", sum(f[5] for f in faces) // 1024, "KB")
