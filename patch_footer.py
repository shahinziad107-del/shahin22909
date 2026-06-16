import glob
import re

new_footer = """    <!-- Footer -->
    <footer class="text-center" style="padding: 15px 0; font-size: 0.85rem;">
        <div class="container">
            <p class="mb-0 text-muted">© 2026 أجرلي Ajarli. جميع الحقوق محفوظة.</p>
        </div>
    </footer>"""

for filepath in glob.glob('*.html'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # We want to replace everything from <!-- Footer --> to </footer>
    # Or from <footer... to </footer>
    
    # Let's try matching <!-- Footer --> block
    # Regex with DOTALL
    pattern = re.compile(r'<!-- Footer -->.*?</footer>', re.DOTALL)
    
    if pattern.search(content):
        new_content = pattern.sub(new_footer, content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated footer in {filepath}")
    else:
        # Fallback to <footer ... > ... </footer>
        pattern_fallback = re.compile(r'<footer.*?</footer>', re.DOTALL)
        if pattern_fallback.search(content):
            new_content = pattern_fallback.sub(new_footer, content)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated footer (fallback) in {filepath}")
        else:
            print(f"No footer found in {filepath}")
