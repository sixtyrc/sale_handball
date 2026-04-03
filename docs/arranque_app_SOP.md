# SOP: ARRANQUE DE LA APLICACIÓN SaaS CLUB HANDBALL
**Fecha:** 2026-04-01
**Estado:** ACTIVO

## 1. OBJETIVO
Definir los pasos para poner en marcha tanto el backend (Django) como el frontend (React/Vite) del proyecto de manera local, asegurando que utilicen el entorno virtual y configuraciones correctas.

## 2. REQUISITOS PREVIOS
- PostgreSQL local en ejecución con la base de datos `salesianosdb`.
- Archivo `.env` configurado en la raíz del proyecto.
- Entorno virtual `venv` inicializado y con las dependencias instaladas.

## 3. PROCEDIMIENTO DE ARRANQUE

### Backend (Django API)
1. Abrir una terminal en la raíz del proyecto (`d:\Proyectos\Salesianos`).
2. Ejecutar: `powershell -Command "cd backend; ..\venv\Scripts\python manage.py runserver 0.0.0.0:8000"`
3. Verificar que responda en `http://localhost:8000/api/v1/`.

### Frontend (React + Vite)
1. Abrir una terminal en la raíz del proyecto.
2. Ejecutar: `powershell -Command "cd frontend; npm run dev -- --host 127.0.0.1 --port 3051"`
3. Verificar que responda en `http://127.0.0.1:3051/`.

## 4. CREDENCIALES DE ACCESO
- **Admin**: `admin / Admin1234!` o `admin@salesianos.com.ar / admin1234`
- **Coach**: `coach@salesianos.com.ar / coach1234`
- **Cantina/Buffet**: `buffet@salesianos.com.ar / buffet1234`

## 5. APRENDIZAJES Y RESTRICCIONES
- **Entorno Virtual**: Se detectó que el entorno virtual correcto es `venv` (o `.venv` dependiendo de la máquina, verificar siempre el .venv activo).
- **Puertos**: El backend utiliza por defecto el puerto `8000`.
- **RESTRICCIÓN DE PUERTO FRONTEND**: A partir de ahora, el frontend debe usar estrictamente el puerto **3051** en `127.0.0.1`. Esto se debe a errores de permisos (`EACCES: permission denied ::1`) con el puerto 5173 y con la resolución de host local en Windows.
- **Comandos**: Para evitar problemas de rutas relativas en Windows, se recomienda hacer `cd` a la carpeta del componente antes de invocar el comando de arranque.
