import glob
import os

files = glob.glob('*.html')
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # We replace the plus with a building icon
    content = content.replace('<i class="fa-solid fa-plus"></i>', '<i class="fa-solid fa-building"></i>')
    
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print('Updated Icons')
