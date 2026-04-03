# FASE 1 - SOP: AUTENTICACIÓN, ROLES Y BASE SOCIETARIA
**Fecha:** 2026-04-03 (Actualizado 11:12)
**Estado:** Actualizado / Estable

## 1. OBJETIVO / CONTEXTO
Establecer el modelo base de usuarios, roles de acceso y el padrón de socios (multi-tenant) sobre el cual pivotará el resto del sistema.
El requerimiento crítico de negocio es que **TODAS** las entidades operativas deben ser autogestionables desde el frontend React PWA por los admins del club, relegando Django admin exclusivamente a mantenimiento de infraestructura.

## 2. MODELOS BASE (App `core`)
- **`Club`**: Entidad raíz multi-tenant.
- **`CustomUser`**: AbstractUser + FK `club` + `role` (ADMIN, PROFESOR, SOCIO_TUTOR, DIRIGENTE).
- **`GrupoFamiliar`** *(Nuevo ABR-2026)*: Agrupa socios de una misma familia para aplicar descuentos escalonados.
- **`Socio`**: Persona física vinculada a un club. FK a `GrupoFamiliar` (opcional).

## 3. MODELO `GrupoFamiliar` — DISEÑO (ABR-2026)
- **Propósito**: Agrupar hermanos, papá/mamá jugadores, bajo un mismo paraguas de descuento.
- **Propiedad `miembros_activos`**: Cuenta socios en estado ACTIVO del grupo.
- **Propiedad `descuento_porcentaje`**: Delega en `ClubConfig` para obtener el % según cantidad de miembros activos.
  - 1 miembro → 0% (no hay descuento por solo 1)
  - 2 miembros → `ClubConfig.descuento_2_hermanos` (default 15%)
  - 3 miembros → `ClubConfig.descuento_3_hermanos` (default 25%)
  - 4+ miembros → `ClubConfig.descuento_4_mas_hermanos` (default 30%)
- **UNIQUE**: `('club', 'nombre')` — dos clubs pueden tener "Familia García" sin conflicto.
- **Endpoint**: `GET/POST/PUT/DELETE /api/v1/grupos-familiares/` (DRF ViewSet multi-tenant).

## 4. CAMPO `nro_socio` — REGLA DE AUTOGENERACIÓN
- No editable manualmente desde el frontend.
- Lógica en `Socio.save()`: `[Primeros 2 dígitos DNI] + [Sufijo 3 dígitos autoincremental global del club]`.
- Ejemplo: DNI 49xxxxxx → 49001, 49002... / DNI 52xxxxxx → 52001 (incremento global, no por prefijo).
- Campo `read_only` en serializer y deshabilitado en modales de edición.

## 5. GESTIÓN DE MENORES Y TUTORES
- Si edad < 18 años: la ficha del socio muestra datos del tutor obligatoriamente.
- Botón WhatsApp directo al tutor (número `tel_tutor`) con mensaje pre-cargado ("Estimado tutor de...").
- La edad y la categoría (Mini / Infantiles / Menores / Cadetes / Juveniles / Mayores) se calculan dinámicamente en el frontend basadas en `fecha_nacimiento`. No persistir en BD.

## 6. BADGES EN FICHA DE SOCIO (UI)
- **Badge Grupo Familiar** (violeta): Muestra nombre del grupo + descuento activo (Ej: "Familia García -15%").
- **Badge Beca** (esmeralda): Muestra porcentaje de beca individual (Ej: "Beca 50%").
- Ambos badges se muestran solo si aplican (condicionales). Tamaño compacto para no alterar el layout de la card.

## 7. RESTRICCIONES Y CASOS BORDE (MEMORIA DE APRENDIZAJE)
- **Multi-Tenant Fuerte**: NUNCA usar ViewSet sin sobreescribir `get_queryset()` filtrando por `club = request.user.club`.
- **Custom User Primero**: `AUTH_USER_MODEL` debe declararse ANTES de la primera migración. Si no, la BD se corrompe.
- **IntegrityError en create Socio**: Catchear `django.db.IntegrityError` en `perform_create()` y retornar 400 amigable. No confiar solo en el serializer DRF.
- **CREDENTIALS**: Credenciales nuevas siempre en `user_pass/user_pass.md` (gitignored).
- **Categorías Dinámicas**: No guardar categoría en BD. Calcular en frontend con `fecha_nacimiento`. Esto evita desajustes al pasar cumpleaños sin actualizar.
- **DNI como etiqueta en UI**: El campo "DNI" debe mostrarse siempre como "DNI" en la interfaz. No usar "ID" para evitar confusión con el UUID interno del sistema.

---
*Documento actualizado al 03/04/2026 11:12 - Sesión: GrupoFamiliar, badges descuento, categorías.*
