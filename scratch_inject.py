import os
import glob

files = glob.glob('*.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # 1. Inject module import
    if 'firebase-app.js' not in content:
        content = content.replace('</body>', '    <script type="module" src="./static/js/firebase-app.js"></script>\n</body>')
    
    # 2. Add ID to login form
    if 'index.html' in f:
        content = content.replace('<form action="home.html" method="GET">', '<form id="login-form">')
    
    # 3. Add ID to add property form
    if 'add_property.html' in f:
        content = content.replace('<form action="home.html" method="GET">', '<form id="add-property-form">')
    
    # 4. Add ID to elements in account.html
    if 'account.html' in f:
        content = content.replace('admin@ajarli.com', '<span id="user-email">جارٍ التحميل...</span>')
        content = content.replace('<h2 class="fw-bold mb-1">المدير العام</h2>', '<h2 class="fw-bold mb-1" id="user-name">جارٍ التحميل...</h2>')
        if 'id="logout-btn"' not in content:
            content = content.replace('<a href="index.html" class="btn btn-danger p-3', '<a href="#" id="logout-btn" class="btn btn-danger p-3')

    # 5. Add properties-container ID in home and my_properties
    if f in ['home.html', 'my_properties.html']:
        if 'id="properties-container"' not in content:
            content = content.replace('<div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4 pb-5">', '<div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4 pb-5" id="properties-container">')
            content = content.replace('<div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">', '<div class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4" id="properties-container">')

    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print('Done injecting JS ids and modules')
