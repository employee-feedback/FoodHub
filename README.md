# FoodHub

Plataforma de evaluación y seguimiento del concesionario de comedor para las plantas Cantera, Barrancas, Juventud y Américas.

| Carpeta | Contenido |
| --- | --- |
| `frontend/` | Aplicación web estática (HTML, CSS, JavaScript) publicada en GitHub Pages. No guarda secretos. |
| `backend/` | Backend en Google Apps Script: API, autenticación, permisos y acceso a Google Sheets. |
| `tools/` | Generador de catálogos (`build_seed.py`) y pruebas locales. |
| `docs/` | Guía de instalación. |

## Estado

Fase 4: inicio de sesión con Google, sesiones (30 días en escritorio, 10 minutos sin uso en tablet), usuarios, roles y plantas autorizadas, catálogos y bitácora.

## Pruebas locales

```bash
node tools/test/harness.js   # backend con servicios de Google simulados
node tools/test/e2e.js       # frontend + backend simulado en Chromium (requiere Playwright)
```

## Catálogos

Los catálogos salen del libro de la Fase 2. Para regenerarlos:

```bash
python3 tools/build_seed.py FoodHub_Catalogos_Fase2_borrador.xlsx backend/Seed.gs
```

Instalación: ver [docs/INSTALACION.md](docs/INSTALACION.md).
