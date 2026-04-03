import json
import os
import datetime

PACKAGE_JSON = 'frontend/package.json'
VERSION_JS = 'frontend/src/version.js'

def update_version():
    if not os.path.exists(PACKAGE_JSON):
        print(f"Error: {PACKAGE_JSON} no encontrado.")
        return

    # 1. Leer y actualizar package.json
    with open(PACKAGE_JSON, 'r') as f:
        data = json.load(f)
    
    version = data.get('version', '1.0.0')
    major, minor, patch = map(int, version.split('.'))
    
    # Simple increment: patch+1. Si pasa de 9, minor+1.
    patch += 1
    if patch > 9:
        patch = 0
        minor += 1
    
    new_version = f"{major}.{minor}.{patch}"
    data['version'] = new_version
    
    with open(PACKAGE_JSON, 'w') as f:
        json.dump(data, f, indent=2)
    
    # 2. Actualizar frontend/src/version.js
    build_date = datetime.datetime.now().strftime("%Y-%m-%d")
    version_content = f'export const APP_VERSION = "{new_version}";\n'
    version_content += f'export const APP_CODENAME = "Vortex";\n'
    version_content += f'export const BUILD_DATE = "{build_date}";\n'
    
    with open(VERSION_JS, 'w') as f:
        f.write(version_content)
        
    print(f"✅ Versión actualizada a {new_version} ({build_date})")

if __name__ == "__main__":
    update_version()
