import os
import glob

html_files = glob.glob('*.html')

old_block = """                <!-- Mobile Theme Switch -->
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

new_block = """                <div class="glass-theme-toggle" dir="ltr">
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

for f_name in html_files:
    with open(f_name, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if old_block in content:
        content = content.replace(old_block, new_block)
        with open(f_name, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {f_name}")
