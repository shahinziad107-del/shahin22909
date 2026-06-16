import glob
import re

new_chat_btn = """
                <div class="dropdown chat-hover-wrapper me-2 d-none d-lg-flex" id="nav-chat-container">
                    <button class="liquid-search-btn chat-toggle-btn" id="nav-chat-btn" data-action="toggle-chat" title="الرسائل" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-color); border: 1px solid rgba(16, 185, 129, 0.4);">
                        <i class="fa-solid fa-comment-dots"></i>
                        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none" id="chat-unread-count" style="font-size: 0.7rem; padding: 0.35em 0.5em;">0</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end chat-hover-dropdown shadow-lg border-0" id="chat-hover-dropdown" style="border-radius: 16px; min-width: 280px; top: 120%; backdrop-filter: blur(10px); background: var(--glass-bg);">
                        <li><span class="dropdown-item text-muted text-center py-3"><i class="fa-solid fa-spinner fa-spin"></i> جاري التحميل...</span></li>
                    </ul>
                </div>
"""

for filepath in glob.glob('*.html'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove "الرئيسية" list item
    # Typical structure:
    # <li class="nav-item">
    #     <a class="nav-link active" href="home.html">الرئيسية</a>
    # </li>
    content = re.sub(r'<li class="nav-item">\s*<a class="nav-link[^>]*href="[^>]*home\.html"[^>]*>الرئيسية</a>\s*</li>', '', content)
    
    # Also handle if it's not active or index.html
    content = re.sub(r'<li class="nav-item">\s*<a class="nav-link[^>]*>الرئيسية</a>\s*</li>', '', content)

    # 2. Remove old "الرسائل" list item
    content = re.sub(r'<li class="nav-item">\s*<a class="nav-link chat-toggle-btn"[^>]*>.*?الرسائل</a>\s*</li>', '', content, flags=re.DOTALL)

    # 3. Inject new chat button before the Theme toggle if not already there
    if 'chat-hover-wrapper' not in content:
        content = content.replace('<div class="glass-theme-toggle"', new_chat_btn + '                <div class="glass-theme-toggle"')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("HTML patching complete.")
