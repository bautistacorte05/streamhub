# StreamHub

Carpeta única para todas tus apps de streaming (Netflix, Max, Prime Video,
Disney+, etc.) + buscador de en qué plataforma está cada película o serie.

Ver [`CONTEXTO.md`](./CONTEXTO.md) para decisiones de diseño y arquitectura.

## Setup

```bash
npm install
npm run dev
```

Antes del primer build hace falta crear `electron/embedded-key.ts` (no se
sube al repo) con una API key de [TMDB](https://www.themoviedb.org/settings/api) —
copiá `electron/embedded-key.example.ts` con ese nombre y pegá la key ahí.
Con eso, quien instale la app ya puede usar **Buscar** sin configurar nada.
Si preferís usar tu propia cuenta de TMDB en cambio de la embebida, podés
cargarla en **Ajustes (⚙)** en cualquier momento.

## Comandos

| Comando         | Qué hace                                      |
| --------------- | ---------------------------------------------- |
| `npm run dev`   | Desarrollo con hot-reload                      |
| `npm run build` | Compila renderer + proceso Electron            |
| `npm start`     | Corre la app ya compilada                      |
| `npm run dist`  | Genera el instalador `.exe` en `/release`      |
