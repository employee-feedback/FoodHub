# FoodHub – Guía de instalación (Fase 4)

Tiempo estimado: 20 a 30 minutos. Todo se hace con la **cuenta Gmail de FoodHub**, no con una cuenta personal.

Al terminar tendrás:

- La base de datos en Google Sheets, creada automáticamente con los catálogos de la Fase 2.
- El backend en Apps Script, publicado como aplicación web.
- El frontend en GitHub Pages, con inicio de sesión de Google.

---

## 1. Cuenta de FoodHub

1. Crea una cuenta Gmail dedicada, por ejemplo `foodhub.comedor@gmail.com`.
2. Activa la verificación en dos pasos en esa cuenta.
3. Guarda la contraseña donde guarden las credenciales del área. Esta cuenta será dueña de los datos.

## 2. ID de cliente de Google (inicio de sesión)

Con la cuenta de FoodHub, en <https://console.cloud.google.com>:

1. Crea un proyecto nuevo llamado `FoodHub`.
2. Ve a **APIs y servicios > Pantalla de consentimiento de OAuth**. Se abre un asistente de 4 pasos:
   1. **Información de la app**: nombre `FoodHub`, correo de asistencia el de FoodHub. **Siguiente**.
   2. **Público**: elige **Externo**. **Siguiente**.
   3. **Información de contacto**: el correo de FoodHub. **Siguiente**.
   4. **Finalizar**: acepta la política y pulsa **Crear**.
   - No agregues permisos extra; basta con los básicos (correo y perfil).
   - Después, en el menú **Público**, pulsa **Publicar app** para que quede **En producción**. Con solo correo y perfil no hace falta que Google la verifique.
3. Ve a **Credenciales > Crear credenciales > ID de cliente de OAuth**:
   - Tipo: **Aplicación web**. Nombre: `FoodHub web`.
   - **Orígenes de JavaScript autorizados**: `https://TU_USUARIO.github.io` (sin la ruta del repositorio y sin `/` final).
   - Deja vacío "URI de redireccionamiento".
4. Copia el **ID de cliente** (termina en `.apps.googleusercontent.com`). No es secreto.

## 3. Backend en Apps Script

1. Con la cuenta de FoodHub, entra a <https://script.google.com> y crea un **Proyecto nuevo** llamado `FoodHub backend`.
2. En **Configuración del proyecto** (engrane):
   - Marca **Mostrar el archivo de manifiesto "appsscript.json"**.
   - Zona horaria: **(GMT-06:00) Chihuahua**.
3. En el **Editor**, reemplaza el contenido de `appsscript.json` con el de `backend/appsscript.json`.
4. Crea un archivo de secuencia de comandos por cada `.gs` de la carpeta `backend/` con el mismo nombre (sin `.gs`) y pega su contenido:
   `Config`, `Schema`, `Db`, `Auth`, `Bitacora`, `Api`, `Setup`, `Seed`. Borra el `Código.gs` vacío.
5. En **Configuración del proyecto > Propiedades del script**, agrega:

   | Propiedad | Valor |
   | --- | --- |
   | `GOOGLE_CLIENT_ID` | El ID de cliente del paso 2 |
   | `ADMIN_EMAIL` | Tu correo de Google, que será el primer administrador |

6. En el editor, abre `Setup`, elige la función `setup` y pulsa **Ejecutar**.
   - Google pedirá autorizar: acceso a hojas de cálculo y a servicios externos. Acepta con la cuenta de FoodHub.
   - Como la app no está verificada, aparece "Google no ha verificado esta app": pulsa **Configuración avanzada > Ir a FoodHub backend**. Es tu propio script.
   - El registro de ejecución muestra los enlaces a la base de datos y la bitácora y lo que creó.
7. **Implementar > Nueva implementación**:
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo** (la cuenta de FoodHub).
   - Quién tiene acceso: **Cualquier usuario**.
   - Copia la **URL de la aplicación web** (termina en `/exec`).

> **Por qué "Cualquier usuario" es seguro aquí:** desde GitHub Pages el navegador no puede enviar las cookies de Google, así que el modo "solo usuarios con cuenta" no funciona. Por eso cada acción del backend exige una sesión válida que solo se obtiene con un correo dado de alta. Sin sesión, la API solo responde `sys.health` y `auth.login`.

## 4. GitHub Pages

1. En el repositorio, abre `frontend/config.js` y reemplaza:
   - `PEGAR_AQUI_URL_EXEC` por la URL `/exec` del paso 3.7.
   - `PEGAR_AQUI_CLIENT_ID.apps.googleusercontent.com` por el ID de cliente del paso 2.
2. Guarda el cambio en la rama `main`.
3. En el repositorio: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
4. El flujo `Publicar frontend` se ejecuta solo con cada cambio en `frontend/`. Al terminar, la app queda en `https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/`.

## 5. Primera prueba

1. Abre la URL de GitHub Pages y entra con el correo que pusiste en `ADMIN_EMAIL`.
2. Ve a **Configuración > Usuarios** y da de alta a las personas de Enfermería y Servicios, con sus plantas.
3. Pide a una persona de Enfermería que entre desde la tablet marcando **Equipo compartido**.

Si algo falla, la pantalla de inicio de sesión muestra el motivo. Los errores del servidor quedan en Apps Script, en **Ejecuciones**.

## 6. Cómo actualizar el backend sin cambiar la URL

Cada vez que cambie el código de Apps Script:

1. Pega los archivos nuevos.
2. Si cambió `Schema.gs` o `Seed.gs`, ejecuta `setup()` otra vez. Solo agrega lo que falte; nunca borra datos.
3. **Implementar > Gestionar implementaciones > Editar (lápiz) > Versión: Nueva versión > Implementar.** La URL `/exec` se mantiene.

## Reglas de seguridad

- No compartas la hoja **FoodHub – Base de datos** con nadie. Quien pueda editarla se salta las validaciones y la bitácora.
- No copies la propiedad `PEPPER` fuera del proyecto. Si se filtra, bórrala y ejecuta `setup()`: se genera otra y todas las sesiones se cierran.
- Para quitar el acceso a alguien, desactívalo en **Configuración > Usuarios**. Sus sesiones se cierran de inmediato.
- `config.js` solo contiene datos públicos. Nunca pongas contraseñas ni claves ahí.
