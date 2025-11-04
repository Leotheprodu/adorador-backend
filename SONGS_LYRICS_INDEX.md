# 📚 Índice de Archivos - Songs-Lyrics Module Refactorizado

## 📂 Estructura del Proyecto

```
src/songs-lyrics/
├── 📄 songs-lyrics.module.ts          [Módulo principal - ACTUALIZADO]
├── 📄 songs-lyrics.service.ts         [Servicio principal - REFACTORIZADO ✨]
├── 📄 songs-lyrics.controller.ts      [Controlador - Sin cambios]
├── 📄 songs-lyrics.swagger.ts         [Documentación Swagger]
├── 📋 songs-lyrics.service.spec.ts    [Tests - Requiere actualización]
├── 📋 songs-lyrics.controller.spec.ts [Tests - Requiere actualización]
│
├── 📁 dto/
│   ├── create-songs-lyric.dto.ts
│   └── update-songs-lyric.dto.ts
│
└── 📁 services/ [NUEVO ✨]
    ├── 🔧 lyrics-normalizer.service.ts      [120 líneas]
    ├── ✅ lyrics-normalizer.service.spec.ts  [10 tests ✅]
    ├── 🎵 chord-processor.service.ts         [350 líneas]
    ├── ✅ chord-processor.service.spec.ts    [29 tests ✅]
    ├── 📖 lyrics-parser.service.ts           [150 líneas]
    └── ✅ lyrics-parser.service.spec.ts      [26 tests ✅]
```

## 📖 Guía Rápida de Navegación

### 🎯 Quiero entender la refactorización

👉 Lee: `SONGS_LYRICS_REFACTORING.md` (Documentación completa)
👉 Lee: `SONGS_LYRICS_REFACTORING_SUMMARY.md` (Resumen ejecutivo)

### 🔧 Quiero ver la normalización de letras

👉 Archivo: `src/songs-lyrics/services/lyrics-normalizer.service.ts`
👉 Tests: `src/songs-lyrics/services/lyrics-normalizer.service.spec.ts`

**Responsabilidades:**

- Eliminar caracteres no válidos
- Normalizar espacios
- Capitalizar primera letra
- Capitalizar palabras divinas (Dios, Jesús, Señor, etc.)

**Métodos principales:**

```typescript
normalize(lyrics: string): string
getDivineWords(): string[]
```

---

### 🎵 Quiero ver el procesamiento de acordes

👉 Archivo: `src/songs-lyrics/services/chord-processor.service.ts`
👉 Tests: `src/songs-lyrics/services/chord-processor.service.spec.ts`

**Responsabilidades:**

- Extraer acordes de una línea
- Calcular posiciones (1-5)
- Redistribuir acordes para evitar duplicados
- Parsear acordes (raíz, calidad, slash)
- Normalizar bemoles a sostenidos

**Métodos principales:**

```typescript
normalizeNote(note: string): string
extractChordsWithPosition(line: string): ChordWithPosition[]
calculateChordPosition(pos: number, len: number): number
redistributePositions(chords): ChordWithFinalPosition[]
parseChord(chord: string): ParsedChord | null
```

---

### 📖 Quiero ver el parseo de archivos

👉 Archivo: `src/songs-lyrics/services/lyrics-parser.service.ts`
👉 Tests: `src/songs-lyrics/services/lyrics-parser.service.spec.ts`

**Responsabilidades:**

- Detectar estructuras (verso, coro, intro, etc.)
- Identificar si una línea tiene acordes
- Validar máximo de acordes por línea
- Parsear contenido del archivo

**Métodos principales:**

```typescript
detectStructure(line: string): number | null
hasChords(line: string): boolean
validateMaxChordsPerLine(lines: string[]): ValidationResult
parseFileContent(content: string): { cleanedLines, lineMapping }
```

---

### 🏗️ Quiero ver el servicio orquestador

👉 Archivo: `src/songs-lyrics/songs-lyrics.service.ts`

**Responsabilidades:**

- CRUD de letras
- Coordinar los servicios especializados
- Operaciones de base de datos
- Parsear y guardar archivos completos

**Dependencias inyectadas:**

```typescript
constructor(
  private prisma: PrismaService,
  private lyricsNormalizer: LyricsNormalizerService,
  private chordProcessor: ChordProcessorService,
  private lyricsParser: LyricsParserService,
)
```

---

### 📦 Quiero ver el módulo

👉 Archivo: `src/songs-lyrics/songs-lyrics.module.ts`

**Providers registrados:**

```typescript
providers: [
  SongsLyricsService,
  LyricsNormalizerService, // ✨ Nuevo
  ChordProcessorService, // ✨ Nuevo
  LyricsParserService, // ✨ Nuevo
  MembershipsService,
  PrismaService,
  SongsService,
];
```

---

## 🧪 Tests

### Ejecutar todos los tests del módulo

```bash
npm test -- songs-lyrics
```

### Ejecutar tests individuales

```bash
# Normalización de letras (10 tests)
npm test -- lyrics-normalizer.service.spec

# Procesamiento de acordes (29 tests)
npm test -- chord-processor.service.spec

# Parseo de archivos (26 tests)
npm test -- lyrics-parser.service.spec
```

### Cobertura de tests

```bash
npm test -- --coverage songs-lyrics
```

---

## 📊 Estado de Tests

| Archivo                             | Tests | Estado                    |
| ----------------------------------- | ----- | ------------------------- |
| `lyrics-normalizer.service.spec.ts` | 10    | ✅ Todos pasando          |
| `chord-processor.service.spec.ts`   | 29    | ✅ Todos pasando          |
| `lyrics-parser.service.spec.ts`     | 26    | ✅ Todos pasando          |
| `songs-lyrics.service.spec.ts`      | -     | ⚠️ Requiere actualización |
| `songs-lyrics.controller.spec.ts`   | -     | ⚠️ Requiere actualización |

**Total de tests nuevos pasando: 65/65** 🎉

---

## 🎯 Casos de Uso Comunes

### Caso 1: Normalizar una letra

```typescript
import { LyricsNormalizerService } from './services/lyrics-normalizer.service';

const normalizer = new LyricsNormalizerService();
const clean = normalizer.normalize('alabamos a dios!!!');
// Output: "Alabamos a Dios"
```

### Caso 2: Parsear un acorde

```typescript
import { ChordProcessorService } from './services/chord-processor.service';

const processor = new ChordProcessorService();
const parsed = processor.parseChord('Cmaj7/G');
// Output: { rootNote: 'C', chordQuality: 'maj7', slashChord: 'G' }
```

### Caso 3: Detectar una estructura

```typescript
import { LyricsParserService } from './services/lyrics-parser.service';

const parser = new LyricsParserService(processor);
const structureId = parser.detectStructure('(verse 1)');
// Output: 2 (ID del verso)
```

---

## 🔗 Enlaces Útiles

- [Documentación Completa](./SONGS_LYRICS_REFACTORING.md)
- [Resumen Ejecutivo](./SONGS_LYRICS_REFACTORING_SUMMARY.md)
- [NestJS Testing Docs](https://docs.nestjs.com/fundamentals/testing)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

## 📞 Soporte

Si tienes preguntas sobre la refactorización:

1. Lee la documentación completa en `SONGS_LYRICS_REFACTORING.md`
2. Revisa los tests para ver ejemplos de uso
3. Consulta este índice para navegar el código

---

**Última actualización**: Noviembre 2025  
**Estado**: ✅ Refactorización completada  
**Tests**: 65/65 pasando 🎉
