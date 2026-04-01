
import os

# Paths
base64_file = r'd:\Proyectos\Salesianos\docs\logo_v3.base64.txt'
html_file = r'd:\Proyectos\Salesianos\docs\BROCHURE_SALESIANOS_PREMIUM.html'

# Read Base64
with open(base64_file, 'r') as f:
    base64_data = f.read().strip().replace('\n', '').replace('\r', '')

# Read HTML
with open(html_file, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Replace placeholder
new_html = html_content.replace('REPLACE_WITH_BASE64_FROM_FILE', base64_data)

# Write back
with open(html_file, 'w', encoding='utf-8') as f:
    f.write(new_html)

print("HTML updated with Base64 transparent logo!")
