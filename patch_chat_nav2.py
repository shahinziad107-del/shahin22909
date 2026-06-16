import glob

new_chat_btn = """
                <div class="dropdown chat-hover-wrapper d-none d-lg-flex" id="nav-chat-container">
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

    # For files missing the chat container (like account.html, my_properties.html, etc)
    if 'id="nav-chat-container"' not in content:
        # Check if they have the top-logout-btn container
        if '<div class="d-flex align-items-center gap-4">' in content:
            # We want to insert the chat button BEFORE the gap-4 div, but INSIDE a wrapper or just change gap-4 to include it
            # Actually, we can replace '<div class="d-flex align-items-center gap-4">' with the chat btn + the div
            content = content.replace(
                '<div class="d-flex align-items-center gap-4">', 
                '<div class="d-flex align-items-center gap-4">\n' + new_chat_btn
            )
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filepath} with chat button")

