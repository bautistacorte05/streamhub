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
   (checkboxes). *(Hasta el 2026-09-14 también tenía un campo para cargar
   una API key de TMDB propia y una sección para agregar/quitar apps
   custom a la carpeta — sacados los dos, ver puntos 6 y 7.)*
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
     - **Actualización (2026-09-14): se sacó la opción de cargar una key
       propia.** Pedido explícito del usuario — "tiene que usarse solo
       con la que genere yo, sino cualquiera se hace dueño de la app".
       Se sacó la sección de Ajustes donde se pegaba una key de TMDB
       propia, y `requireApiKey()` en `electron/tmdb.ts` ya ni siquiera
       lee `Config.tmdbApiKey` — usa `EMBEDDED_TMDB_API_KEY` siempre, sin
       excepción. El campo `tmdbApiKey` sigue en el tipo `Config` por
       compatibilidad con instalaciones viejas (no rompe nada, solo ya
       no se usa). Los mensajes de error de `SearchView.tsx` que decían
       "revisala en Ajustes" se cambiaron a un genérico ("no está
       disponible ahora, probá más tarde") porque ya no hay nada que el
       usuario pueda revisar ahí.
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

6. **Sin API key propia (2026-09-14)**: se sacó de Ajustes la opción de
   cargar una API key de TMDB propia — ver detalle en "Key de TMDB
   embebida" arriba (Decisiones tomadas). Motivo del usuario: que la
   búsqueda dependa siempre de la cuenta de TMDB que genera StreamHub,
   no de la que cualquiera cargue a mano.

7. **Sin agregar apps custom por ahora (2026-09-14)**: se sacó de
   Ajustes la sección para sumar una app/web que no esté en la lista
   por defecto. Decisión del usuario: en vez de un campo genérico para
   que cualquiera agregue cualquier cosa, prefiere sumar plataformas
   puntuales a `DEFAULT_PLATFORMS` (`src/data/platforms.ts`) si empieza
   a haber demanda real de alguna en particular. `Config.myApps` sigue
   existiendo (lo siguen usando `PlatformGrid` y el matching de
   `SearchView`) — instalaciones viejas que ya tenían apps custom
   cargadas las siguen viendo, solo que ya no hay forma de agregar ni
   quitar desde la UI.

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
- **2026-09-14**: sesión larga, en orden:
  - **~12:31** — reportado por el usuario (captura de pantalla) que
    clickear "Disney Plus" desde el buscador llevaba a un 404 real de
    Disney+. Arreglado en `src/data/platforms.ts` (ver "Disney+ perdió
    su ruta pública de búsqueda" en Decisiones tomadas): ahora cae a la
    home en vez de a un link roto.
  - **12:34** — commit `05a70f1` con el fix + bump a v0.1.1. Build
    (`npm run dist`) y publicado el release v0.1.1 en GitHub con el
    instalador.
  - **12:36** — commit `1863c3a`: landing page (`docs/index.html`)
    actualizada a v0.1.1 (versión + link de descarga). Mismo cambio
    espejado en `scratchpad/download-page.html` y en el Artifact
    publicado.
  - **~12:40** — pedido explícito del usuario: *"la app tiene que
    actualizarse, la gente no tiene que volver a descargar la app
    completa"*. Se agregó auto-actualización con `electron-updater` (ver
    punto 5 de "Features implementadas": banner de reinicio, chequeo
    automático, `npm run release` reemplazando el build+upload manual).
  - **12:54** — commit `2a5578e` con todo el código del auto-update +
    bump a v0.1.2. Publicado el release v0.1.2 (`npm run release`),
    corregido a mano que no quedara en draft (ver "Auto-actualización"
    en Decisiones tomadas — el default de electron-builder es dejarlo en
    draft), landing page actualizada a v0.1.2 en las 3 copias otra vez.
  - **~13:00** — el usuario pidió el link de "la v0.1.3 con el update de
    Disney": aclarado que no existe v0.1.3 — el fix de Disney+ es de
    v0.1.1 y sigue incluido en v0.1.2 (que además ya trae el
    auto-update), se le pasó el link de v0.1.2. De paso se encontró un
    release **v0.1.2 duplicado en GitHub** (un draft huérfano, id
    `388521961`, que quedó de un reintento de `npm run release` que no
    reusó el draft del primer intento fallido — ver detalle abajo). Es
    inofensivo (los drafts no los ve nadie ni el auto-update), pero
    ensucia la lista de releases; intentar borrarlo con `gh release
    delete`/`gh api DELETE` fue bloqueado por el modo automático de
    Claude Code (acción destructiva) — **queda pendiente borrarlo a
    mano** desde github.com/bautistacorte05/streamhub/releases o
    autorizando esa acción puntual.
  - Verificado en el camino: `npm run build` y `npm run lint` limpios en
    cada paso, release v0.1.2 público (no draft) confirmado con los 3
    assets que necesita electron-updater (`latest.yml`,
    `StreamHub-Setup-0.1.2.exe`, `.exe.blockmap`), link de descarga
    probado con `curl` (200).
  - **~13:05 a ~14:00** — landing page (`docs/index.html`, espejada en
    `scratchpad/` + Artifact, sin tocar la app): cambio de copy ("una
    sola carpeta" → "en un solo lugar", "así se ve tu carpeta" → "así se
    ve tu app de StreamHub", "Tu carpeta" → "StreamHub" en Features),
    recorte del paso 02 (se sacó el párrafo que explicaba el aviso de
    Windows, queda solo el título + la imagen + la acción a hacer), y
    una animación en el botón de descarga: al clickear, una persona
    entra caminando por abajo del botón, agarra la flecha (que se
    desvanece del ícono) y se la lleva — pura animación CSS + un
    trigger chico en JS, respeta `prefers-reduced-motion`. Primer
    intento fue una figura de "palitos" geométrica; el usuario mandó una
    imagen de referencia (ilustración de iStock, persona con cabeza
    grande y redondeada, cara simple, trazos curvos) y se rehizo la
    figura para que se pareciera a eso — cabeza grande con cara (ojos +
    sonrisa + pelito), torso/brazos/piernas curvos, manos y pies
    ovalados, ícono agrandado de 17px a 21px para que las proporciones
    se noten.
  - **~14:05** — pedido explícito del usuario, en mayúsculas: *"NO
    PUSHEES NUNCA NADA A GITHUB SIN CONSULTARME"* — dicho después de
    varios pushes ya hechos en la sesión sin problema, así que la regla
    es "confirmar SIEMPRE antes de cada push", no algo que se dé por
    aprobado una vez. Guardado en memoria persistente
    (`confirm-before-git-push.md`) para que aplique en sesiones futuras
    tambien. Desde ese pedido: los cambios de la figura humana quedaron
    solo commiteados+pusheados recién cuando el usuario dijo
    explícitamente "pushealo" (commit `bf1395b`).
  - **~15:45** — pedido explícito del usuario sobre Ajustes de la app
    (no la landing): sacar la API key propia de TMDB, sacar "agregar
    otra app", y achicar (no sacar del todo, para no violar los
    Términos de Uso de TMDB) la atribución del pie. Ver puntos 6 y 7 de
    "Features implementadas" para el detalle. Verificado: `npm run
    build` y `npm run lint` limpios. **Sin pushear** — queda pendiente
    de confirmación del usuario (ver regla de arriba).
  - **~15:50 a 16:00** — pedido explícito del usuario: revisión de todo
    el código "como un senior de 10 años", antes de pushear nada, para
    que quede prolijo. Encontrado y arreglado:
    - **Tipos duplicados a mano** entre `electron/*.ts` y
      `src/types.ts` (`Config`, `SearchResult`, `Provider`, etc.) —
      dos fuentes de verdad que había que recordar mantener
      sincronizadas. Se movieron a `electron/shared-types.ts` (solo
      `interface`/`type`, cero dependencias de Node/Electron) y ambos
      lados reexportan desde ahí. Verificado con build completo que un
      `import type` se borra al compilar y no filtra código de
      `electron/` al bundle del renderer (`dist/assets/*.js` no
      contiene `shared-types`).
    - **Bug real en `ProviderBadges.tsx`**: el mensaje de "no
      encontramos X en streaming" decía **"en Argentina" hardcodeado**
      sin importar la región real configurada — quedó de antes del
      soporte multi-región (2026-09-11), nunca se actualizó ese string
      puntual. Ahora usa la región de `Config` (enhebrada
      `App.tsx` → `SearchView.tsx` → `ProviderBadges.tsx`) y muestra el
      label correcto de `REGIONS`.
    - **Posible doble-inicialización de `electron-updater`**: si
      `createWindow()` se llamara dos veces (ej. `app.on('activate')`),
      `initUpdater()` agregaría los listeners y timers de chequeo dos
      veces sobre el mismo `autoUpdater` (es un singleton del modulo).
      No pasa hoy en la práctica (la app abre una sola ventana), pero
      se agregó un guard (`initialized`) porque no cuesta nada.
    - **Comentarios y textos desactualizados** que quedaron mencionando
      features ya sacadas hoy mismo (API key propia, agregar apps
      custom): `electron/embedded-key.example.ts`,
      `src/components/OnboardingWizard.tsx` (dos lugares),
      `src/data/platforms.ts`, `README.md`.
    - `scratchpad/` sumado a `.gitignore` (es carpeta de trabajo
      temporal, no debería poder colarse en un commit).
    - Confirmado que `docs/index.html` y `scratchpad/download-page.html`
      (el mirror del Artifact) no se habían desincronizado en todos los
      cambios de la landing de hoy (diff a mano, solo difieren en el
      wrapper HTML que agrega el Artifact).
    - Verificado: `npm run build` y `npm run lint` limpios, sin `any` en
      todo el código, sin `console.log`/TODOs olvidados. **Sin
      pushear** — commiteado local nomás, pendiente de confirmación.
  - **16:05** — el usuario confirmó: "pushealo y vemos si funciona el
    auto-update". Pusheados `24dc09d` y `7524445` a `main`. Para probar
    el auto-update de verdad hacía falta una version mas nueva que la
    v0.1.2 ya publicada (que es la que trae el codigo de
    electron-updater) — se bumpeo a **v0.1.3** (settings sin API key
    propia ni agregar apps, fix del bug de "en Argentina" hardcodeado,
    dedupe de tipos) y se publico con `npm run release`. El build viejo
    sin instalar en `release/win-unpacked/` (de cuando se publico
    v0.1.2, intacto desde entonces) se uso como "usuario que ya tenia
    v0.1.2" para probar que detecta y baja la v0.1.3 sola. Resultado de
    la prueba: ver mas abajo en esta misma entrada — se completa
    despues de correrla.
