// Plantilla: copiar este archivo a "embedded-key.ts" (ese nombre esta en
// .gitignore, no se sube) y pegar ahi la API key v3 de TMDB de la cuenta
// dedicada a StreamHub (NO la key personal de otra app) — ver CONTEXTO.md,
// seccion "Key de TMDB embebida", para el por que.
//
// Si "embedded-key.ts" no existe o queda con el string vacio, la app sigue
// funcionando igual: cada usuario puede cargar su propia key desde Ajustes
// (Config.tmdbApiKey tiene prioridad sobre esta, ver electron/tmdb.ts).
export const EMBEDDED_TMDB_API_KEY = ''
