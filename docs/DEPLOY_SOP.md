# SOP: Guía de Despliegue Técnica y de Servidor (Salesianos)

**Rol:** Administrador de Sistemas (CTSoft)
**Versión:** 1.8.5
**Entorno de Red:** Windows Server (Caddy + NSSM)
**URL de Test:** `https://salesianos.ctsoft.com.ar`

---

## 🛡️ Configuración Estructural del Servidor

### 1. Puertos de Servicio (Inamovibles)
Para evitar conflictos con otros sistemas en el mismo servidor (Avícola, AgendaSpa), se ha asignado:
- **Puerto 8000:** Avícola
- **Puerto 8001:** AgendaSpa
- **Puerto 8002:** **Salesianos (ESTE PROYECTO)**

### 2. Configuración de Caddy (Caddyfile)
Ubicación: `C:\caddy\Caddyfile`
Bloque específico que debe existir para este proyecto:
```caddy
salesianos.ctsoft.com.ar {
    encode gzip
    handle /api/* { reverse_proxy 127.0.0.1:8002 }
    handle /admin/* { reverse_proxy 127.0.0.1:8002 }
    handle_path /static/* {
        root * C:\www\sale_handball\backend\staticfiles
        file_server
    }
    handle_path /media/* {
        root * C:\www\sale_handball\backend\media
        file_server
    }
    handle {
        root * C:\www\sale_handball\frontend\dist
        try_files {path} /index.html
        file_server
    }
}
```

### 3. Servicio de Windows (NSSM)
Para mantener el backend corriendo siempre, se usa **NSSM** con el servicio `SalesianosBackend`:
- **Path:** `C:\www\sale_handball\backend\venv\Scripts\python.exe`
- **Startup dir:** `C:\www\sale_handball\backend`
- **Arguments:** `manage.py runserver 0.0.0.0:8002`

---

## 🚀 Ciclo de Actualización (Deploy Rápido)

Cada vez que quieras bajar cambios de GitHub al servidor, seguí este orden:

### Paso 1: Sincronizar Git
```powershell
cd C:\www\sale_handball
git checkout test
git pull origin test
```

### Paso 2: Actualizar Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
# Reiniciar el servicio (Desde PowerShell Admin)
Restart-Service SalesianosBackend
```

### Paso 3: Actualizar Frontend
```powershell
cd ..\frontend
npm install
npm run build
```

### Paso 4: Refrescar Servidor Web
```powershell
cd C:\caddy
.\caddy.exe reload
```

---

## ⚙️ Checklist Crítico de Errores (Troubleshooting)

- **Error 405 (Method Not Allowed) en Login:** Ocurre si el frontend intenta hacer un POST a una ruta estática (ej: `/login/`) en lugar de ir a la API (`/api/v1/login/`). Solución: Verificar que el build del frontend use URLs absolutas con `window.location.origin` y que el `Caddyfile` tenga correctamente el bloque `handle /api/*`.
- **Detección de Entorno:** El sistema usa `window.location.hostname === 'localhost'` para alternar entre puerto 8002 (Local) y producción (SSL).
- **Error "fatal: not a git repository":** Asegurate de estar DENTRO de `C:\www\sale_handball` y no en la raíz `C:\www`.
- **Caddy Line 92 Error:** Ocurre si faltan las llaves `{}` de cierre en los bloques de subdominios anteriores (AgendaSpa).
- **Backend no carga (502 Bad Gateway):** 
    1. Revisar que el puerto en NSSM sea el mismo que en el Caddyfile (`8002`).
    2. Verificar que el servicio `SalesianosBackend` esté en estado "Running".
- **Falta de íconos o estilos en el Admin:** Verificar que se ejecutó `python manage.py collectstatic` y que la ruta en `handle_path /static/*` en Caddy sea correcta.

---

## 📝 Bitácora de Versiones (Changelog Actual)
- Correcto direccionamiento de API en puerto 8002 (Solución a ERR_CONNECTION_REFUSED).
- Implementación de Versionado Automático y Detección de Entorno (DEV/TEST).
- Arreglo de Syntax Error por comillas simples en URLs dinámicas.
- Agregado el Manual Interactivo para Admin/Staff.
- Implementado sistema de estadísticas deportivas acumulativas.
- Soporte para voluntarios nominativos en Somos Local.
- Configuración de arqueo dinámico de caja para partidos.
