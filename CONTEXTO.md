# Contexto del proyecto — StreamHub

> Este archivo existe para que, la próxima vez que se retome este proyecto,
> se pueda leer el contexto acá en vez de tener que explicarlo de cero.
> Actualizarlo cada vez que se agregue algo relevante.

## Qué es

App de escritorio **personal** de Bauti: una "carpeta" única con accesos
directos a todas las plataformas de streaming (Netflix, Max, Prime Video,
Disney+, etc.) para no tener que buscar cada app por separado, más un
buscador de títulos que dice en qué plataforma está disponible cada
película/serie (usando la API de TMDB).

- **Carpeta local**: `D:\streamhub`
- **Stack**: Electron + React + Vite + TypeScript (sin base de datos —
  config simple en JSON)
- **Región**: fija en `AR` (Argentina) por ahora, hardcodeada en
  `electron/config.ts` (`DEFAULT_CONFIG.region`).

## Decisiones tomadas (y por qué)

- **Electron, no web app**: pedido explícito del usuario. Se evaluó
  después desplegar una versión web en Vercel si el concepto funciona bien
  — todavía no se hizo, la lógica de negocio (`src/data/platforms.ts`,
  matching de providers) está separada de lo Electron-específico
  (`window.api.*`) para que sea fácil de portar el día que se decida.
- **Proyecto separado** de `D:\gastos-mensuales` (otra app Electron del
  mismo usuario) — a propósito no chocan:
  - `appId` distinto: `com.bauti.streamhub` vs `com.bauti.gastosmensuales`.
  - Puerto de Vite dev distinto: `5174` vs `5173` (ver `vite.config.ts`).
  - Carpeta de userData distinta (Electron ya lo resuelve solo por
    `productName`/`name`): `%APPDATA%\streamhub` vs `%APPDATA%\gastos-mensuales`.
- **Sin SQLite**: no hace falta — el único estado a persistir es la API
  key de TMDB, la región y la lista de apps custom que agregue el usuario.
  Se guarda como JSON plano en `%APPDATA%\streamhub\config.json`
  (`electron/config.ts`). Evita además el problema que tuvo
  gastos-mensuales con `better-sqlite3` necesitando Visual Studio Build
  Tools para `electron-builder`.
- **"Abrir" una plataforma = `shell.openExternal`** al navegador del
  sistema, no un `<webview>`/`BrowserWindow` embebido. La mayoría de estos
  sitios usan DRM (Widevine) y bloquean o dan problemas dentro de un
  iframe/webview de Electron; abrir en el navegador default es lo simple
  y confiable.
- **Búsqueda "¿en qué plataforma está?" con TMDB** (themoviedb.org): API
  gratuita, oficial, con endpoint `watch/providers` por región. Requiere
  que el usuario tenga su propia API key (v3 auth) — se pide y guarda
  desde el modal de Ajustes, no viene hardcodeada en el repo.
  - Search: `GET /search/multi` (películas + series).
  - Providers: `GET /movie|tv/{id}/watch/providers`, filtrado por
    `results.AR`.
  - El link "fallback" que devuelve TMDB (`results.AR.link`) apunta a una
    página de JustWatch, no a la plataforma directamente — por eso
    `src/data/platforms.ts` intenta primero matchear el nombre del
    provider (ej. "Amazon Prime Video") contra la lista de plataformas
    conocidas para linkear directo a esa plataforma en vez de a JustWatch.
  - **Pedido explícito del usuario (2026-09-10): que no sea doble
    búsqueda.** Al principio el click en un provider abría la home de la
    plataforma (ej. netflix.com), lo que obligaba a buscar el título de
    nuevo ahí adentro. Se cambió `Platform.searchUrl(title)` en
    `src/data/platforms.ts` para armar la URL de búsqueda de ese título
    específico en cada plataforma (Netflix, Max, Prime Video, Paramount+,
    Apple TV+, YouTube, Crunchyroll tienen patrón conocido; Movistar Play,
    Flow y Disney+ no, así que esas caen a la home). **Límite real:
    ninguna plataforma expone un link público que abra "play" de un
    título puntual** (eso requiere partnership privado, ej. el que tiene
    JustWatch) — aterrizar en la búsqueda ya hecha es lo máximo posible
    sin eso.
  - **Disney+ perdió su ruta pública de búsqueda (detectado 2026-09-14):**
    `disneyplus.com/search?q=...` (y `/search` a secas) empezaron a
    devolver 404 real — reportado por el usuario con captura (click en
    "Disney Plus" desde el buscador de la app) y confirmado por fetch
    directo. Se le sacó el `searchUrl` a Disney+ en
    `src/data/platforms.ts`; ahora cae a la home como Movistar Play y
    Flow. Si en el futuro Disney+ vuelve a exponer una ruta de búsqueda
    pública y estable, se puede restaurar el patrón.

## Features implementadas

1. **Mis apps** (carpeta): grilla de tiles con Netflix, Max, Prime Video,
   Disney+, Paramount+, Apple TV+, YouTube, Movistar Play, Flow,
   Crunchyroll + las que el usuario agregue en Ajustes. Se puede ocultar
   cualquiera de las default (ver punto 4). Click abre la URL en el
   navegador default.
2. **Buscar**: input de texto → resultados de TMDB (poster, título, año,
   tipo) → al seleccionar uno, muestra badges de las plataformas donde
   está en streaming por suscripción (`flatrate`) en la región configurada,
   cada una clickeable.
3. **Ajustes** (modal): país/región, qué plataformas default tenés
   (checkboxes), API key de TMDB (con link directo a cómo sacarla),
   agregar/quitar apps custom a la carpeta.
4. **Multiusuario "cada uno con sus apps" (2026-09-11)**: pedido del
   usuario — poder compartir/distribuir la app a otras personas, cada una
   con su propia config (sin backend, sin cuentas/contraseñas de las
   plataformas — decisión explícita del usuario, ver historial). Como la
   config ya vivía en `%APPDATA%\<usuario-windows>\streamhub\config.json`,
   cada instalación (o cada usuario de Windows en la misma PC) ya era
   independiente; lo que faltaba era que la app dejara de asumir "vos sos
   Bauti, en Argentina, con estas 10 apps":
   - `region` (ya existía en `Config` pero estaba hardcodeada a `AR` sin UI)
     ahora es elegible desde Ajustes y desde el wizard de bienvenida
     (`src/data/regions.ts`: lista curada AR/MX/BR/CL/CO/PE/UY/PY/BO/EC/VE/ES/US).
     El idioma que se le pide a TMDB (`electron/tmdb.ts`,
     `LANGUAGE_BY_REGION`) se deriva de esa región (antes hardcodeado
     `es-AR`); regiones sin mapeo caen a `es-419`.
   - `Config.disabledPlatformIds: string[]` (nuevo campo): ids de
     `DEFAULT_PLATFORMS` que el usuario destildó porque no las tiene.
     Vacío por default → no rompe nada para configs viejas (se ven todas,
     como antes). Se edita desde Ajustes ("Mis plataformas") o desde el
     wizard.
   - **Wizard de bienvenida** (`src/components/OnboardingWizard.tsx`,
     2 pasos: país → qué apps tenés). Se muestra solo si
     `Config.onboardingComplete` es `false`. Migración en
     `electron/config.ts` `readConfig()`: si el config no tiene ese campo
     (instalaciones de antes de que existiera el wizard) pero ya tiene
     `tmdbApiKey` o `myApps`, se asume completado — así no le vuelve a
     aparecer a nadie que ya usaba la app.
   - **Key de TMDB embebida (2026-09-11)**: pedido del usuario — la
     mayoría de la gente a la que se le comparta la app no sabe qué es una
     API key ni quiere crearse una cuenta en TMDB solo para probarla, y
     eso era motivo de fricción/abandono. Se creó una cuenta de TMDB
     *dedicada* (no la personal del usuario, que ya la usaba en otra app)
     con el truco de alias de Gmail (`+streamhub` antes de la `@`, mismo
     inbox, cuenta distinta) — TMDB solo permite **una API key por
     cuenta**, no se pueden generar varias desde la misma
     ([confirmado acá](https://www.themoviedb.org/talk/65a2c101297338012712f525)).
     Esa key vive en `electron/embedded-key.ts` (**gitignored**, no se
     sube — ver plantilla en `electron/embedded-key.example.ts`) y es el
     fallback en `electron/tmdb.ts` (`requireApiKey()`) cuando
     `Config.tmdbApiKey` está vacío. Consecuencias:
     - El wizard y `SearchView` ya no piden ni dependen de una API key —
       la búsqueda funciona de una para cualquiera que instale la app.
       Cargar una key propia queda como override 100% opcional en
       Ajustes (dejar el campo vacío y guardar vuelve a usar la
       embebida).
     - Riesgo asumido conscientemente: es una key de cliente, extraíble
       del build (no es un secreto fuerte — común en apps que usan TMDB).
       Si alguna vez se abusa y TMDB la limita/revoca, se corta el
       buscador para todos los usuarios hasta generar una nueva — por eso
       se uso una cuenta separada de la personal, para que no afecte nada
       más si eso pasa.
     - Se agregó al pie de Ajustes la atribución que piden los Términos
       de Uso de TMDB ("Esta app usa la API de TMDB pero no está avalada
       ni certificada por TMDB").
     - Troubleshooting real de esta sesión: la primera key que pegó el
       usuario en el chat llegó con un caracter de más (33 en vez de 32,
       típico largo de una v3 key) — probablemente un glitch al
       transcribirla — y TMDB la rechazaba con 401. Si en el futuro el
       buscador tira `TMDB_HTTP_ERROR_401` de entrada (sin que el usuario
       haya cargado una key propia en Ajustes), lo primero a revisar es
       contar los caracteres de `EMBEDDED_TMDB_API_KEY` (debe tener
       exactamente 32, hexadecimal) o probarla directo:
       `curl "https://api.themoviedb.org/3/authentication/token/new?api_key=<key>"`
       — si devuelve `"success":true` la key esta bien y el bug esta en
       otro lado.

   Sigue sin haber backend, cuentas ni credenciales de terceros
   guardadas — cada instalación es 100% local e independiente. Si en
   algún momento se quiere sync entre dispositivos o vender con pago
   recurrente, eso es un cambio de arquitectura más grande (backend +
   auth) que no se arrancó — ver "Cosas pendientes".

5. **Auto-actualización (2026-09-14)**: pedido explícito del usuario —
   que la gente no tenga que volver a descargar el instalador entero a
   mano cada vez que hay un fix. Se agregó `electron-updater`
   (`electron/updater.ts`), apuntando al feed de GitHub Releases del
   repo (`build.publish` en `package.json`, provider `github`).
   - Descarga en segundo plano sola (`autoDownload = true`) apenas hay
     un release nuevo publicado (chequea al arrancar y despues cada 4hs
     mientras la app sigue abierta); nunca interrumpe de golpe — se
     instala cuando el usuario toca "Reiniciar ahora" en el aviso que
     aparece abajo de la pantalla (`src/components/UpdateBanner.tsx`) o,
     si nunca lo toca, sola al cerrar la app (`autoInstallOnAppQuit`).
   - Solo se activa si `app.isPackaged` (instalación real) — en `npm run
     dev` o `npm start` sin instalar no hay `app-update.yml`, tirarle
     autoUpdater ahí da error porque no hay feed que consultar.
   - **Publicar un release ya NO es "generar el .exe y subirlo a mano
     con `gh release upload`"** — eso deja afuera el `latest.yml` que
     necesita electron-updater para saber si hay version nueva, y con
     nombres de archivo que no siempre coinciden con lo que
     electron-updater espera. Ahora es `npm run release`
     (`electron-builder --publish always`, con `GH_TOKEN` en el
     entorno), que sube instalador + `.blockmap` + `latest.yml` con los
     nombres exactos. `build.publish.draft` está en `false` a propósito
     — el default de electron-builder es crear el release como **draft**
     (invisible para el chequeo de updates y para la landing page) y hay
     que acordarse de publicarlo a mano si eso vuelve a pasar
     (`gh release edit vX.Y.Z --draft=false`).
   - **Límite real de esta primera versión**: quien ya tenía v0.1.1 (sin
     este código) tuvo que bajar el instalador una vez más a mano
     (v0.1.2, la primera que lo incluye) — recién de ahí en adelante las
     próximas versiones se instalan solas. No hay forma de auto-update
     retroactivo para versiones que nunca tuvieron `electron-updater`.

## Arquitectura (importante si se retoca)

Mismo patrón que `gastos-mensuales`:
- `electron/` = proceso principal, compilado aparte con `tsc` puro a
  CommonJS en `dist-electron/` (no bundleado con Vite).
  `electron/dist-package.json` se copia a `dist-electron/package.json`
  para forzar CommonJS ahí (el resto del proyecto usa `"type": "module"`).
- `src/` = UI en React, compilada por Vite como SPA. `base: './'` en
  `vite.config.ts` porque en producción se carga `dist/index.html` via
  `file://`.
- `window.api.*` (expuesto en `electron/preload.ts` vía `contextBridge`,
  tipado en `src/types.ts`): `config.get/set`, `tmdb.search/providers`,
  `shell.openExternal`.
- Errores de `electron/tmdb.ts` viajan como `Error.message` (ej.
  `"MISSING_API_KEY"`, `"TMDB_HTTP_ERROR_401"`) porque es lo único que
  sobrevive el viaje de `ipcRenderer.invoke()` de vuelta al renderer —
  `src/components/SearchView.tsx` (`errorMessage()`) los traduce a texto
  legible.

## Comandos

```bash
npm install
npm run dev      # desarrollo con hot-reload (vite + tsc watch + electron)
npm run build    # compila todo (renderer + proceso electron)
npm start        # corre la app ya compilada
npm run dist     # genera el instalador .exe (electron-builder) en /release, sin publicar
npm run release  # genera el instalador Y lo publica en GitHub Releases
                 # (instalador + .blockmap + latest.yml) -- necesita
                 # GH_TOKEN en el entorno con permiso de escritura en el
                 # repo. Es lo que hace que el auto-update (ver punto 5
                 # de "Features implementadas") vea la version nueva.
```

## Cosas pendientes / ideas ofrecidas (no confirmadas por el usuario)

- Poder reordenar las plataformas en la grilla (ocultar ya se puede,
  desde 2026-09-11).
- Versión web para Vercel (mencionada como posibilidad futura, no
  arrancada).
- Ícono propio para el `.exe` (usa el default de Electron por ahora).
- Si más adelante se quiere sync entre dispositivos o cobrar
  suscripción: requiere backend + autenticación real, hoy no existe
  (decisión explícita del usuario en 2026-09-11: por ahora sigue siendo
  100% local, sin backend, gratis).

## Historial de sesiones

- **2026-09-10**: creación del proyecto desde cero (Electron + React +
  TypeScript + Vite, sin SQLite). Se armaron las 3 pantallas (Mis apps,
  Buscar, Ajustes). Falta que el usuario cargue su API key de TMDB
  (se lo guió para sacarla en themoviedb.org/settings/api) y correr
  `npm install` / `npm run dev` por primera vez.
- **2026-09-11**: pedido del usuario: "llevar la app al siguiente nivel"
  para poder compartirla/venderla a otros usuarios, cada uno con sus
  propias apps de streaming. Se aclaró con el usuario (no se asumió):
  "cuentas" = elegir qué plataformas tenés, **no** guardar
  usuario/contraseña de Netflix/etc.; arquitectura = seguir 100%
  Electron local (cada instalación independiente, sin backend); sin
  monetización por ahora. Implementado: región configurable (antes
  hardcodeada `AR`), poder ocultar plataformas default que no usás, y un
  wizard de bienvenida de 3 pasos en el primer arranque. Ver punto 4 de
  "Features implementadas" para el detalle tecnico. Verificado
  levantando la app instrumentada con un `--user-data-dir` aislado (sin
  tocar el config real del usuario) para capturar screenshots del wizard
  y de Ajustes — build y lint (`npm run build`, `npm run lint`) pasan
  limpios.
- **2026-09-14**: reportado por el usuario (captura de pantalla) que
  clickear "Disney Plus" desde el buscador llevaba a un 404 real de
  Disney+. Arreglado (ver "Disney+ perdió su ruta pública de búsqueda" en
  Decisiones tomadas) y publicado como v0.1.1 (release + landing page
  actualizados). Mismo día, pedido explícito del usuario: "la app tiene
  que actualizarse, la gente no tiene que volver a descargar la app
  completa" → se agregó auto-actualización con `electron-updater` (ver
  punto 5 de "Features implementadas") y se publicó v0.1.2 como el
  primer release que la trae. Landing page (`docs/index.html`,
  `scratchpad/download-page.html`, Artifact publicado) actualizada a
  v0.1.2. Verificado: `npm run build` y `npm run lint` limpios, release
  v0.1.2 confirmado público (no draft) en GitHub con los 3 assets que
  necesita electron-updater, link de descarga probado con `curl` (200).
