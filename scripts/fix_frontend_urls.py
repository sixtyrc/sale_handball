import os

def fix_urls(directory):
    target_string = "http://localhost:8000"
    replacement_logic = "${window.location.hostname === 'localhost' ? 'http://localhost:8002' : ''}"
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith((".jsx", ".js")):
                path = os.path.join(root, file)
                # Skip the script itself and some common skip dirs
                if "node_modules" in path or "dist" in path:
                    continue
                    
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                if target_string in content:
                    print(f"Fixing {path}...")
                    # We need to be careful with template literals. 
                    # If it's already in a template literal `...http://localhost:8000...`, we replace it.
                    # If it's in a normal string 'http://localhost:8000', we might need to convert it to a template literal.
                    
                    # Simply replacing the string inside existing template literals where it mostly resides
                    new_content = content.replace(target_string, replacement_logic)
                    
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)

if __name__ == "__main__":
    frontend_src = r"d:\Proyectos\Salesianos\frontend\src"
    fix_urls(frontend_src)
