// Plantilla: copiar este archivo a "embedded-key.ts" (ese nombre esta en
// .gitignore, no se sube) y pegar ahi la API key v3 de TMDB de la cuenta
// dedicada a StreamHub (NO la key personal de otra app) — ver CONTEXTO.md,
// seccion "Key de TMDB embebida", para el por que.
//
// Es la UNICA key que usa la app (electron/tmdb.ts ya no acepta una key
// cargada por el usuario, ver CONTEXTO.md). Si "embedded-key.ts" no existe
// o queda con el string vacio, el buscador tira MISSING_API_KEY -- hace
// falta esta key para poder compilar/correr StreamHub con el buscador
// funcionando.
export const EMBEDDED_TMDB_API_KEY = ''
