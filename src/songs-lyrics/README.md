# Songs-Lyrics Module

## 📋 Descripción

Módulo refactorizado para gestionar las letras de canciones y sus acordes. Diseñado con principios SOLID para máxima testabilidad y mantenibilidad.

## ✨ Características

- ✅ **CRUD completo** de letras de canciones
- ✅ **Parseo de archivos** con letras y acordes
- ✅ **Normalización automática** de texto
- ✅ **Procesamiento inteligente** de acordes
- ✅ **Detección de estructuras** (verso, coro, intro, etc.)
- ✅ **Validación** de formatos
- ✅ **65 tests unitarios** pasando

## 🏗️ Arquitectura

El módulo está dividido en **4 servicios especializados**:

### 1. `SongsLyricsService` (Orquestador)

- Coordina los otros servicios
- Maneja operaciones CRUD
- Interactúa con la base de datos

### 2. `LyricsNormalizerService`

- Limpia y normaliza texto
- Capitaliza palabras divinas
- Elimina caracteres no válidos

### 3. `ChordProcessorService`

- Procesa acordes musicales
- Calcula posiciones (1-5)
- Parsea acordes complejos

### 4. `LyricsParserService`

- Parsea archivos de letras
- Detecta estructuras
- Valida formato

## 📁 Estructura

```
src/songs-lyrics/
├── songs-lyrics.service.ts      (Orquestador)
├── songs-lyrics.controller.ts   (API REST)
├── songs-lyrics.module.ts       (Módulo NestJS)
├── dto/                         (DTOs)
└── services/                    (Servicios especializados)
    ├── lyrics-normalizer.service.ts
    ├── chord-processor.service.ts
    └── lyrics-parser.service.ts
```

## 🚀 Inicio Rápido

### Uso en un Servicio

```typescript
import { Injectable } from '@nestjs/common';
import { LyricsNormalizerService } from './services/lyrics-normalizer.service';
import { ChordProcessorService } from './services/chord-processor.service';
import { LyricsParserService } from './services/lyrics-parser.service';

@Injectable()
export class MyService {
  constructor(
    private lyricsNormalizer: LyricsNormalizerService,
    private chordProcessor: ChordProcessorService,
    private lyricsParser: LyricsParserService,
  ) {}

  processLyrics(text: string) {
    // Normalizar texto
    const normalized = this.lyricsNormalizer.normalize(text);

    // Detectar estructura
    const structure = this.lyricsParser.detectStructure('(verse)');

    // Procesar acordes
    const chords = this.chordProcessor.extractChordsWithPosition('C D E F');

    return { normalized, structure, chords };
  }
}
```

## 🧪 Tests

```bash
# Ejecutar todos los tests
npm test -- songs-lyrics

# Ejecutar tests específicos
npm test -- lyrics-normalizer.service.spec
npm test -- chord-processor.service.spec
npm test -- lyrics-parser.service.spec

# Con cobertura
npm test -- --coverage songs-lyrics
```

### Estado de Tests

| Servicio         | Tests  | Estado |
| ---------------- | ------ | ------ |
| LyricsNormalizer | 10     | ✅     |
| ChordProcessor   | 29     | ✅     |
| LyricsParser     | 26     | ✅     |
| **Total**        | **65** | **✅** |

## 📖 API Endpoints

### Crear letra

```http
POST /bands/:bandId/songs/:songId/lyrics
Content-Type: application/json

{
  "structureId": 2,
  "lyrics": "Te alabo Señor",
  "position": 1
}
```

### Subir archivo

```http
POST /bands/:bandId/songs/:songId/lyrics/upload
Content-Type: multipart/form-data

file: [archivo con letras y acordes]
```

### Obtener todas las letras

```http
GET /bands/:bandId/songs/:songId/lyrics
```

### Actualizar letra

```http
PATCH /bands/:bandId/songs/:songId/lyrics/:id
Content-Type: application/json

{
  "lyrics": "Nueva letra",
  "position": 2
}
```

### Eliminar letra

```http
DELETE /bands/:bandId/songs/:songId/lyrics/:id
```

## 📝 Formato de Archivo

Para subir letras con acordes, usa este formato:

```
(verse)
C       D       E       F
Te alabo Señor con todo mi corazón

(chorus)
G       Am      F       C
Porque Tú eres Dios
```

### Reglas:

- Las estructuras van entre paréntesis: `(verse)`, `(coro)`, etc.
- Los acordes van en una línea separada
- La letra va en la línea siguiente
- Máximo 5 acordes por línea
- Soporta acordes: `C`, `Dm7`, `Cmaj7`, `C/G`, etc.

## 🎯 Estructuras Soportadas

| Estructura | ID  | Español           | English               |
| ---------- | --- | ----------------- | --------------------- |
| Intro      | 1   | introduccion      | intro, introduction   |
| Verso      | 2   | verso             | verse                 |
| Pre-coro   | 3   | pre-coro, precoro | pre-chorus, prechorus |
| Coro       | 4   | coro, estribillo  | chorus, refrain       |
| Puente     | 5   | puente            | bridge                |
| Interludio | 6   | interludio        | interlude             |
| Solo       | 7   | intermedio        | solo                  |
| Final      | 8   | final, salida     | outro                 |

## 🎵 Acordes Soportados

### Notas Raíz

`C`, `C#`, `D`, `D#`, `E`, `F`, `F#`, `G`, `G#`, `A`, `A#`, `B`

### Calidades

- Mayores: (vacío), `maj7`, `maj9`, `maj11`, `maj13`
- Menores: `m`, `m7`, `m9`, `m11`, `m13`, `mMaj7`
- Suspendidos: `sus2`, `sus4`
- Disminuidos: `dim`, `dim7`, `m7b5`
- Aumentados: `aug`
- Dominantes: `7`, `9`, `11`, `13`

### Slash Chords

Formato: `C/G`, `Dm7/A`, etc.

## 📚 Documentación

### Documentos Disponibles

1. **[SONGS_LYRICS_REFACTORING.md](../../SONGS_LYRICS_REFACTORING.md)**

   - Documentación completa de la refactorización
   - Arquitectura detallada
   - Métricas y comparaciones

2. **[SONGS_LYRICS_REFACTORING_SUMMARY.md](../../SONGS_LYRICS_REFACTORING_SUMMARY.md)**

   - Resumen ejecutivo
   - Resultados de tests
   - Próximos pasos

3. **[SONGS_LYRICS_INDEX.md](../../SONGS_LYRICS_INDEX.md)**

   - Índice de archivos
   - Guía de navegación
   - Referencias rápidas

4. **[SONGS_LYRICS_EXAMPLES.md](../../SONGS_LYRICS_EXAMPLES.md)**
   - Ejemplos de uso completos
   - Casos de uso comunes
   - Best practices

## 🔧 Desarrollo

### Agregar nuevo servicio

1. Crear archivo en `services/`
2. Agregar al módulo en `songs-lyrics.module.ts`
3. Inyectar donde sea necesario
4. Crear tests

### Ejecutar en desarrollo

```bash
# Iniciar en modo desarrollo
npm run start:dev

# Ver logs
npm run start:dev -- --watch
```

## 🤝 Contribuir

1. Crea una rama: `git checkout -b feature/mi-feature`
2. Haz tus cambios
3. Escribe tests
4. Ejecuta tests: `npm test`
5. Crea un PR

## 📄 Licencia

Este proyecto es parte del backend de Adorador.

---

**Estado**: ✅ Producción  
**Tests**: 65/65 pasando  
**Cobertura**: ~90%  
**Última actualización**: Noviembre 2025
