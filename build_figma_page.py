"""Build a self-contained, scrollable review page from the prototype screens."""

from html import escape
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "TatCaManHinh.html"
SCREENS = [
    ("01", "Danh sách người cao tuổi – Y tá", "DanhSach.html", "an"),
    ("02", "Y tá – Lưu trú", "Main.html", "an"),
    ("03", "Y tá – Bán trú", "YTaBanTru.html", "binh"),
    ("04", "Y tá – Tại nhà", "YTaTaiNha.html", "phuc"),
    ("05", "Hồ sơ y tế", "HoSoYTe.html", "an"),
    ("06", "Bác sĩ – Khám", "BacSi.html", "an"),
    ("07", "Chỉ định", "ChiDinh.html", "an"),
    ("08", "Kết luận", "KetLuan.html", "an"),
    ("09", "Kết luận – Chờ kết quả", "KetLuanCho.html", "binh"),
    ("10", "Lễ tân – Check-in", "LeTan.html", None),
]


def inline_screen(filename: str, patient: str | None) -> str:
    source = (ROOT / filename).read_text(encoding="utf-8")
    match = re.search(r"<body\b[^>]*>(.*?)</body>", source, re.I | re.S)
    if not match:
        raise ValueError(f"Missing body in {filename}")
    body = re.sub(r"<script\b[^>]*>.*?</script>", "", match.group(1), flags=re.I | re.S)
    # This review page is a visual snapshot; scripts from the individual pages
    # would otherwise bind to duplicate IDs across the ten screen sections.
    return body


cards = []
for number, label, filename, patient in SCREENS:
    document = inline_screen(filename, patient)
    cards.append(
        '<section class="screen">'
        f'<div class="screen-label"><span class="number">{number}</span>'
        f'<h2>{escape(label)}</h2><code>{escape(filename)}</code></div>'
        f'<div class="screen-content" aria-label="{escape(label, quote=True)}">'
        f'{document}</div></section>'
    )

page = '''<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kazoku – Toàn bộ màn hình prototype</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
''' + (ROOT / "assets/proto.css").read_text(encoding="utf-8") + '''
  * { box-sizing: border-box; }
  body { margin: 0; background: #e8eeeb; color: #1f2a2e; font-family: Inter, Arial, sans-serif; }
  .intro { padding: 32px max(24px, calc((100vw - 1440px) / 2)); background: #fff; border-bottom: 1px solid #d5ded9; }
  .intro h1 { margin: 0 0 6px; font-size: 26px; }
  .intro p { margin: 0; font-size: 14px; color: #596a66; }
  main { width: 1440px; max-width: 100%; margin: auto; padding: 30px 16px 70px; }
  .screen { margin: 0 0 36px; background: white; border: 1px solid #cedbd4; border-radius: 16px; box-shadow: 0 10px 24px #18261c12; overflow: hidden; }
  .screen-label { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: #e4f2ec; border-bottom: 1px solid #cedbd4; }
  .number { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; background: #0e6e66; color: white; font-size: 13px; font-weight: 700; }
  h2 { margin: 0; font-size: 16px; }
  code { margin-left: auto; font-size: 12px; color: #526962; }
  .screen-content { background: #f5f6f4; }
  .screen-content a { color: #0e6e66; }
  .screen-content button, .screen-content input, .screen-content select, .screen-content textarea { font-family: inherit; }
  @media (max-width: 700px) { .screen-label { flex-wrap: wrap; } code { margin-left: 44px; } main { padding: 16px 8px; } }
</style>
</head>
<body>
<header class="intro"><h1>Kazoku – Toàn bộ màn hình prototype</h1>
<p>10 màn hình nối tiếp để xem và đưa vào Figma. Mỗi màn giữ nguyên kiểu trình bày riêng.</p></header>
<main>
''' + "\n".join(cards) + '''
</main>
<script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
</body>
</html>
'''
OUTPUT.write_text(page, encoding="utf-8")
print(f"Built {OUTPUT.name}: {len(SCREENS)} screens, {OUTPUT.stat().st_size:,} bytes")
