// Ensures dist-electron/*.js is parsed as CommonJS by Node/Electron,
// overriding the root package.json's "type": "module".
import { copyFileSync, mkdirSync } from 'node:fs'

mkdirSync('dist-electron', { recursive: true })
copyFileSync('electron/dist-package.json', 'dist-electron/package.json')
