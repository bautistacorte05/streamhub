export interface Region {
  code: string
  label: string
}

// Lista curada de paises donde suelen operar las plataformas de
// DEFAULT_PLATFORMS. El codigo es el "watch region" que espera la API de
// TMDB (ISO 3166-1 alpha-2). No hace falta que sea exhaustiva: si el pais
// del usuario no esta, puede cargar el codigo a mano en Ajustes.
export const REGIONS: Region[] = [
  { code: 'AR', label: 'Argentina' },
  { code: 'MX', label: 'México' },
  { code: 'BR', label: 'Brasil' },
  { code: 'CL', label: 'Chile' },
  { code: 'CO', label: 'Colombia' },
  { code: 'PE', label: 'Perú' },
  { code: 'UY', label: 'Uruguay' },
  { code: 'PY', label: 'Paraguay' },
  { code: 'BO', label: 'Bolivia' },
  { code: 'EC', label: 'Ecuador' },
  { code: 'VE', label: 'Venezuela' },
  { code: 'ES', label: 'España' },
  { code: 'US', label: 'Estados Unidos' },
]
