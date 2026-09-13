// Levanta la app ya compilada (dist/, dist-electron/) apuntando a un
// userData temporal y aislado, en vez del real (%APPDATA%\streamhub). Sirve
// para ver exactamente lo que ve alguien que instala StreamHub por primera
// vez (wizard de bienvenida, key embebida, etc.) sin tocar tu config
// personal. Se borra y se recrea vacio en cada corrida, asi siempre arranca
// como instalacion nueva. Ver "npm run preview:fresh".
import { spawnSync } from 'node:child_process'
import { rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const profileDir = join(tmpdir(), 'streamhub-preview-profile')
rmSync(profileDir, { recursive: true, force: true })
mkdirSync(profileDir, { recursive: true })

const electronBin = join(
  'node_modules',
  'electron',
  'dist',
  process.platform === 'darwin' ? 'Electron.app/Contents/MacOS/Electron' : 'electron.exe',
)

console.log(`[preview:fresh] perfil temporal: ${profileDir}`)
console.log('[preview:fresh] tu config real (%APPDATA%\\streamhub) no se toca.')

spawnSync(electronBin, ['.', `--user-data-dir=${profileDir}`], { stdio: 'inherit' })
