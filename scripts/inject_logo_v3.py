
import os
import re

# Paths
base64_file = r'd:\Proyectos\Salesianos\docs\logo_v3.base64.txt'
html_file = r'd:\Proyectos\Salesianos\docs\BROCHURE_SALESIANOS_PREMIUM.html'

# Read Base64
with open(base64_file, 'r') as f:
    base64_data = f.read().strip().replace('\n', '').replace('\r', '')

# Read HTML
with open(html_file, 'r', encoding='utf-8') as f:
    html_content = f.read()

# Regex to find the img tag with class "hero-logo-inline" and replace src content
# Since it's Base64, we search for src="data:image/png;base64,..."
pattern = r'(<img[^>]+class=["\']hero-logo-inline["\'][^>]+src=["\'])data:image/png;base64,[^"\']*(["\'])'
replacement = r'\1data:image/png;base64,' + base64_data + r'\2'

new_html = re.sub(pattern, replacement, html_content)

if new_html == html_content:
    print("Warning: Content not replaced. Trying placeholder method.")
    # Fallback to the placeholder if the user fixed it manually or it was never there
    new_html = html_content.replace('REPLACE_WITH_BASE64_FROM_FILE', base64_data)

# Write back
with open(html_file, 'w', encoding='utf-8') as f:
    f.write(new_html)

print("HTML (Brochure) updated with REAL transparent logo!")
