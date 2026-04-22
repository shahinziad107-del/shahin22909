import os

files = ['index.html', 'register.html']
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    parts = content.split('<!-- Mobile Bottom Nav -->')
    if len(parts) > 1:
        rest = parts[1].split('</div>\n', 1)
        if len(rest) > 1:
            content = parts[0] + rest[1].strip() + '\n'
            
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print('Cleaned')
