import glob
import re

for filepath in glob.glob('*.html'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove the existing liquid-search-btn from navbar
    btn_pattern = r'\s*<button class="liquid-search-btn d-none d-lg-flex" data-bs-toggle="modal" data-bs-target="#searchModal" title="بحث">\s*<i class="fa-solid fa-magnifying-glass"></i>\s*</button>\s*'
    content = re.sub(btn_pattern, '\n', content)

    # Add the floating version right before </body>
    floating_btn = '''
    <!-- Floating Desktop Search Button -->
    <button class="liquid-search-btn floating-search-btn d-none d-lg-flex" data-bs-toggle="modal" data-bs-target="#searchModal" title="بحث" id="desktop-floating-search">
        <i class="fa-solid fa-magnifying-glass"></i>
    </button>
'''
    if 'floating-search-btn' not in content:
        content = content.replace('</body>', floating_btn + '</body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
print("HTML updated.")
