import glob
import re

for filepath in glob.glob('*.html'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace the paragraph tag in the footer
    old_p = '<p class="mb-0 text-muted">© 2026 أجرلي Ajarli. جميع الحقوق محفوظة.</p>'
    new_p = '<p class="mb-0 footer-glass-glow fw-bold">© 2026 أجرلي Ajarli. جميع الحقوق محفوظة.</p>'
    
    if old_p in content:
        content = content.replace(old_p, new_p)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated footer glow in {filepath}")
    else:
        print(f"Footer paragraph not found in {filepath} (might already be updated)")
