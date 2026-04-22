import os
import glob

bottom_nav = """
    <!-- Mobile Bottom Nav -->
    <div class="mobile-bottom-nav d-lg-none">
        <a href="home.html" class="nav-item">
            <i class="fa-solid fa-house"></i>
        </a>
        <a href="#" class="nav-item">
            <i class="fa-solid fa-magnifying-glass"></i>
        </a>
        <a href="add_property.html" class="nav-item center-add-btn">
            <div class="add-btn-inner">
                <i class="fa-solid fa-plus"></i>
            </div>
        </a>
        <a href="#" class="nav-item">
            <i class="fa-solid fa-phone"></i>
        </a>
        <a href="account.html" class="nav-item">
            <i class="fa-regular fa-user"></i>
        </a>
    </div>
"""

toggler_str = """            <button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <i class="fa-solid fa-bars fs-2 text-primary"></i>
            </button>"""

files = glob.glob("*.html")
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace toggler
    if toggler_str in content:
        content = content.replace(toggler_str, "<!-- Mobile Nav Toggler Removed -->")
    else:
        print(f"Toggler not found in exactly this format in {f}")
    
    # Add bottom nav before </body> if not exists
    if "mobile-bottom-nav" not in content and "</body>" in content:
        # replace </body> (the last occurrence ideally, but string replace replaces all, usually there's only one)
        content = content.replace("</body>", bottom_nav + "\n</body>")
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
        
print("Navs updated successfully!")
