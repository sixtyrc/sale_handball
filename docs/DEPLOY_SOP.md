# SOP: Guía de Despliegue a Producción/Test (Windows Server)

**Rol Requerido:** Administrador del Servidor (CTSoft)
**Versión Actual:** 1.8
**Rama de Test Recomendada:** `test`
**Rama de Producción:** `main`

---

## 🚀 Proceso de Despliegue Continuo (Paso a Paso)

Este proceso asume que el repositorio Git ya está clonado en el servidor Windows en la ruta base (ej: `C:\inetpub\wwwroot\salesianos`).

### 1. Actualización desde Control de Versiones (Git)
Desde una consola de PowerShell administrada:
```powershell
cd C:\inetpub\wwwroot\salesianos
# 1. Asegurarse de estar en la rama de TEST o MAIN
git checkout test
# 2. Descargar los últimos cambios
git pull origin test
```

### 2. Actualización del Backend (Django)
```powershell
cd backend
# 1. Activar el entorno virtual (si se utiliza)
.\venv\Scripts\Activate.ps1
# 2. Instalar nuevas dependencias (ej: num2words)
pip install -r requirements.txt
# 3. Aplicar migraciones de base de datos
python manage.py makemigrations
python manage.py migrate
# 4. Recolectar archivos estáticos para el admin
python manage.py collectstatic --noinput
```

### 3. Actualización del Frontend (Vite/React)
```powershell
cd ..\frontend
# 1. Instalar dependencias nuevas
npm install
# 2. Compilar versión optimizada
npm run build
```

### 4. Reinicio de Servicios (Caddy & Python)
```powershell
# Reiniciar el servidor Caddy (si corre como servicio)
Restart-Service caddy
# Si el backend corre mediante un gestor como PM2 o Waitress, reiniciarlo:
pm2 restart django-backend
```

---

## ⚙️ Checklist Crítico Post-Deploy

- [ ] **.env Frontend:** Verificar que `VITE_API_URL` apunte al dominio final y no a `localhost`.
- [ ] **.env Backend:** 
    - `DEBUG=False`
    - `ALLOWED_HOSTS=salesianos.ctsoft.com.ar`
    - `CORS_ALLOWED_ORIGINS=https://salesianos.ctsoft.com.ar`
- [ ] **Archivos Media:** Asegurar que la carpeta `/backend/media` tenga permisos de escritura.
- [ ] **Módulo Caddy:** Revisar si las redirecciones del Caddyfile apuntan correctamente a la carpeta `/frontend/dist`.

## 📝 Changelog Reciente a Testear
- Soporte Nominativo en Somos Local (identificación profunda por DNI).
- Cuadro de arqueo dinámico con visualización PDF.
- Reporte cruzado de Planillas Deportivas a Perfiles Individuales (Goles, Tarjetas).
- Inclusión del nuevo Manual Interactivo nativo en el menú central.
