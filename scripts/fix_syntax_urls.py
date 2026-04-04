import os

def fix_syntax(directory):
    # El error fue usar '${...}' con comillas simples fuera, debe ser `${...}` con backticks
    # Buscamos la cadena mal formada y la corregimos
    wrong_pattern = "'${window.location.hostname === 'localhost' ? 'http://localhost:8002' : ''}"
    correct_pattern = "`${window.location.hostname === 'localhost' ? 'http://localhost:8002' : ''}"
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith((".jsx", ".js")):
                path = os.path.join(root, file)
                if "node_modules" in path or "dist" in path:
                    continue
                    
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if wrong_pattern in content:
                    print(f"Fixing syntax in {path}...")
                    # Reemplazamos el inicio mal formado
                    new_content = content.replace(wrong_pattern, correct_pattern)
                    # Y nos aseguramos de cerrar con backtick si terminaba en '/api/v1/'
                    new_content = new_content.replace("/api/v1/'", "/api/v1/`")
                    
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)

if __name__ == "__main__":
    frontend_src = r"d:\Proyectos\Salesianos\frontend\src"
    fix_syntax(frontend_src)
