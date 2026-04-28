import os

target_files = [
    'account.html',
    'add_property.html',
    'admin_panel.html',
    'edit_property.html',
    'home.html',
    'my_properties.html',
    'property_detail.html',
    'settings.html'
]

old_nav_item = '<a class="nav-link" href="#"><i class="fa-solid fa-phone ms-1"></i>تواصل معنا</a>'
new_nav_item = '<a class="nav-link chat-toggle-btn" href="#" data-action="toggle-chat"><i class="fa-solid fa-comment-dots ms-1"></i>الرسائل</a>'

old_mobile_item = '''<a href="#" class="nav-item">
            <i class="fa-solid fa-phone"></i>
        </a>'''
new_mobile_item = '''<a href="#" class="nav-item chat-toggle-btn" data-action="toggle-chat">
            <i class="fa-solid fa-comment-dots"></i>
        </a>'''

for file_name in target_files:
    if os.path.exists(file_name):
        with open(file_name, 'r', encoding='utf-8') as f:
            content = f.read()
        
        updated = False
        if old_nav_item in content:
            content = content.replace(old_nav_item, new_nav_item)
            updated = True
        
        if old_mobile_item in content:
            content = content.replace(old_mobile_item, new_mobile_item)
            updated = True
            
        if updated:
            with open(file_name, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {file_name}")

print("HTML update script finished.")
