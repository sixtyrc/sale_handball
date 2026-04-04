import os

def fix_robust_urls(directory):
    # Vamos a usar window.location.origin para que no haya duda de la ruta en produccion
    # Y mantenemos el puerto 8002 forzado para localhost
    target_pattern = "`${window.location.hostname === 'localhost' ? 'http://localhost:8002' : ''}/api/v1/`"
    # Tambien buscamos la variante que meti en api.js y authStore.js
    variant_pattern = "window.location.hostname === 'localhost' ? 'http://localhost:8002/api/v1/' : '/api/v1/'"
    
    # El reemplazo robusto
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
                if target_pattern in content:
                    content = content.replace(target_pattern, robust_logic)
                    changed = True
                if variant_pattern in content:
                    content = content.replace(variant_pattern, robust_logic)
                    changed = True
                
                if changed:
                    print(f"Applying robust URL logic to {path}...")
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)

if __name__ == "__main__":
    frontend_src = r"d:\Proyectos\Salesianos\frontend\src"
    fix_robust_urls(frontend_src)
