import glob

for filepath in glob.glob('*.html'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    new_lines = []
    skip = False
    for i, line in enumerate(lines):
        if '<li class="nav-item">' in line and i+1 < len(lines) and 'data-bs-target="#searchModal"' in lines[i+1]:
            skip = True
            continue
        if skip:
            if '</li>' in line:
                skip = False
            continue
        new_lines.append(line)
    
    content = '\n'.join(new_lines)

    new_btn = '''                <button class="liquid-search-btn d-none d-lg-flex" data-bs-toggle="modal" data-bs-target="#searchModal" title="بحث">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </button>
'''
    
    if 'liquid-search-btn' not in content:
        content = content.replace('<div class="glass-theme-toggle"', new_btn + '                <div class="glass-theme-toggle"')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print('Done')
