# FoodHub – Guía de instalación (Fase 4)

Tiempo estimado: 15 a 20 minutos. Todo se hace con la **cuenta Gmail de FoodHub**, no con una cuenta personal.

Al terminar tendrás:

- La base de datos en Google Sheets, creada automáticamente con los catálogos de la Fase 2.
- El backend en Apps Script, publicado como aplicación web.
- El frontend en GitHub Pages, con inicio de sesión por código al correo (igual que TalentHub).

---

## 1. Cuenta de FoodHub

1. Crea una cuenta Gmail dedicada, por ejemplo `foodhub.comedor@gmail.com`.
2. Activa la verificación en dos pasos en esa cuenta.
3. Guarda la contraseña donde guarden las credenciales del área. Esta cuenta será dueña de los datos.

## 2. Backend en Apps Script

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
   | `ADMIN_EMAIL` | Tu correo (por ejemplo el de Teleflex), que será el primer administrador |

6. En el editor, abre `Setup`, elige la función `setup` y pulsa **Ejecutar**.
   - Google pedirá autorizar: acceso a hojas de cálculo y a enviar correo (para los códigos de acceso). Acepta con la cuenta de FoodHub.
   - Como la app no está verificada, aparece "Google no ha verificado esta app": pulsa **Configuración avanzada > Ir a FoodHub backend**. Es tu propio script.
   - El registro de ejecución muestra los enlaces a la base de datos y la bitácora y lo que creó.
7. **Implementar > Nueva implementación**:
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo** (la cuenta de FoodHub).
   - Quién tiene acceso: **Cualquier usuario**.
   - Copia la **URL de la aplicación web** (termina en `/exec`).

> **Por qué "Cualquier usuario" es seguro aquí:** desde GitHub Pages el navegador no puede enviar las cookies de Google, así que el modo "solo usuarios con cuenta" no funciona. Por eso cada acción del backend exige una sesión válida que solo se obtiene con un correo dado de alta. Sin sesión, la API solo responde `sys.health` y las dos acciones para pedir y validar el código.

## 3. GitHub Pages

1. En el repositorio, abre `frontend/config.js` y reemplaza `PEGAR_AQUI_URL_EXEC` por la URL `/exec` del paso 2.7.
2. Guarda el cambio en la rama `main`.
3. En el repositorio: **Settings > Pages > Build and deployment > Source: GitHub Actions**.
4. El flujo `Publicar frontend` se ejecuta solo con cada cambio en `frontend/`. Al terminar, la app queda en `https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/`.

## 4. Primera prueba

1. Abre la URL de GitHub Pages, escribe el correo que pusiste en `ADMIN_EMAIL` y pulsa **Enviarme un código**. El código llega desde la cuenta de FoodHub (revisa también correo no deseado) y vence en 10 minutos.
2. Escribe el código. Con **Recordar este equipo 30 días** marcado, no vuelve a pedirlo en esa computadora durante 30 días.
3. Ve a **Configuración > Usuarios** y da de alta a las personas de Enfermería y Servicios, con sus plantas.
4. En la tablet compartida, desmarca **Recordar este equipo**: la sesión dura 6 horas y se borra al cerrar el navegador.

> Gmail personal permite unos 100 correos al día. Cada código usa uno; con sesiones de 30 días alcanza de sobra.

Si algo falla, la pantalla de inicio de sesión muestra el motivo. Los errores del servidor quedan en Apps Script, en **Ejecuciones**.

## 5. Cómo actualizar el backend sin cambiar la URL

Cada vez que cambie el código de Apps Script:

1. Pega los archivos nuevos.
2. Si cambió `Schema.gs` o `Seed.gs`, ejecuta `setup()` otra vez. Solo agrega lo que falte; nunca borra datos.
3. **Implementar > Gestionar implementaciones > Editar (lápiz) > Versión: Nueva versión > Implementar.** La URL `/exec` se mantiene.

## Reglas de seguridad

- No compartas la hoja **FoodHub – Base de datos** con nadie. Quien pueda editarla se salta las validaciones y la bitácora.
- No copies la propiedad `PEPPER` fuera del proyecto. Si se filtra, bórrala y ejecuta `setup()`: se genera otra y todas las sesiones se cierran.
- Para quitar el acceso a alguien, desactívalo en **Configuración > Usuarios**. Sus sesiones se cierran de inmediato.
- `config.js` solo contiene datos públicos. Nunca pongas contraseñas ni claves ahí.
