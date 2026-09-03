import glob
import os

html_files = glob.glob('*.html')

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False

    # Inject chat_styles.css into head if missing
    if 'chat_styles.css' not in content:
        if '</head>' in content:
            content = content.replace('</head>', '    <link rel="stylesheet" href="./chat_styles.css">\n</head>')
            changed = True

    # Inject chat_logic.js before firebase-app.js if missing
    if 'chat_logic.js' not in content:
        if '<script type="module" src="./static/js/firebase-app.js"></script>' in content:
            content = content.replace(
                '<script type="module" src="./static/js/firebase-app.js"></script>',
                '<script src="./chat_logic.js"></script>\n    <script type="module" src="./static/js/firebase-app.js"></script>'
            )
            changed = True
        elif '</body>' in content:
            content = content.replace(
                '</body>',
                '    <script src="./chat_logic.js"></script>\n</body>'
            )
            changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {filepath}")

print("All HTML files patched successfully!")
