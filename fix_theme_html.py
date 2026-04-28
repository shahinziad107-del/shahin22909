import os

target_files = [
    'account.html',
    'add_property.html',
    'admin_panel.html',
    'edit_property.html',
    'home.html',
    'my_properties.html',
    'property_detail.html',
    'settings.html',
    'user_profile.html'
]

old_html = """                <div class="glass-theme-toggle" dir="ltr">
                    <div class="toggle-slider"></div>
                    <button class="theme-btn" data-theme-val="light" title="وضع النهار">
                        <i class="fa-regular fa-sun"></i>
                    </button>
                    <button class="theme-btn" data-theme-val="dark" title="وضع الليل">
                        <i class="fa-regular fa-moon"></i>
                    </button>
                    <button class="theme-btn" data-theme-val="auto" title="تلقائي">
                        <i class="fa-solid fa-cloud-sun"></i>
                    </button>
                </div>"""

new_html = """                <!-- Mobile Theme Switch -->
                <div class="glass-theme-toggle d-flex d-lg-none" dir="ltr">
                    <div class="toggle-slider"></div>
                    <button class="theme-btn" data-theme-val="light" title="وضع النهار">
                        <i class="fa-regular fa-sun"></i>
                    </button>
                    <button class="theme-btn" data-theme-val="dark" title="وضع الليل">
                        <i class="fa-regular fa-moon"></i>
                    </button>
                    <button class="theme-btn" data-theme-val="auto" title="تلقائي">
                        <i class="fa-solid fa-cloud-sun"></i>
                    </button>
                </div>

                <!-- Desktop Theme Click -->
                <button class="btn btn-outline-secondary rounded-circle theme-toggle-click d-none d-lg-flex align-items-center justify-content-center me-2 ms-2" style="width: 45px; height: 45px;" title="تبديل المظهر">
                    <i class="theme-icon fa-solid fa-cloud-sun fs-5"></i>
                </button>"""

for file_name in target_files:
    if os.path.exists(file_name):
        with open(file_name, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if old_html in content:
            content = content.replace(old_html, new_html)
            with open(file_name, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {file_name}")

print("HTML update script finished.")
