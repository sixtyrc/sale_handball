import os

def force_absolute_api(directory):
    # Ya no queremos fallbacks a variables de entorno que nos den problemas
    # Forzamos la lógica robusta en todo el sistema
    old_logic = "import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8002/api/v1/' : `${window.location.origin}/api/v1/`)"
    another_old = "import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8002/api/v1/' : '/api/v1/')"
    
    robust_logic = "window.location.hostname === 'localhost' ? 'http://localhost:8002/api/v1/' : `${window.location.origin}/api/v1/`"
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith((".jsx", ".js")):
                path = os.path.join(root, file)
                if "node_modules" in path or "dist" in path:
                    continue
                    
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                changed = False
                if old_logic in content:
                    content = content.replace(old_logic, robust_logic)
                    changed = True
                if another_old in content:
                    content = content.replace(another_old, robust_logic)
                    changed = True
                
                if changed:
                    print(f"Forcing absolute API in {path}...")
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)

if __name__ == "__main__":
    frontend_src = r"d:\Proyectos\Salesianos\frontend\src"
    force_absolute_api(frontend_src)
