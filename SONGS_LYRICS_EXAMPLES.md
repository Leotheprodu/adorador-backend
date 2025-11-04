# 💡 Ejemplos de Uso - Songs-Lyrics Services

Esta guía muestra ejemplos prácticos de cómo usar los servicios refactorizados.

## 📋 Tabla de Contenidos

1. [LyricsNormalizerService](#lyricsnormalizerservice)
2. [ChordProcessorService](#chordprocessorservice)
3. [LyricsParserService](#lyricsparserservice)
4. [Integración Completa](#integración-completa)

---

## 🔧 LyricsNormalizerService

### Ejemplo 1: Normalizar texto básico

```typescript
import { LyricsNormalizerService } from './services/lyrics-normalizer.service';

const normalizer = new LyricsNormalizerService();

// Texto con múltiples problemas
const input = 'alabamos   a  (dios)  con  "todo"  el  corazon!!!';
const output = normalizer.normalize(input);

console.log(output);
// Output: "Alabamos a Dios con todo el corazon"
```

### Ejemplo 2: Capitalizar palabras divinas

```typescript
const input1 = 'jesús es el señor';
const output1 = normalizer.normalize(input1);
// Output: "Jesús es el Señor"

const input2 = 'el espíritu santo nos guía';
const output2 = normalizer.normalize(input2);
// Output: "El Espíritu Santo nos guía"

const input3 = 'rey de reyes y señor de señores';
const output3 = normalizer.normalize(input3);
// Output: "Rey De Reyes y Señor de señores"
```

### Ejemplo 3: Obtener lista de palabras divinas

```typescript
const divineWords = normalizer.getDivineWords();
console.log(divineWords);
// Output: ['dios', 'señor', 'padre', 'hijo', 'jesús', ...]
```

---

## 🎵 ChordProcessorService

### Ejemplo 1: Normalizar bemoles a sostenidos

```typescript
import { ChordProcessorService } from './services/chord-processor.service';

const processor = new ChordProcessorService();

console.log(processor.normalizeNote('Db')); // Output: 'C#'
console.log(processor.normalizeNote('Eb')); // Output: 'D#'
console.log(processor.normalizeNote('Bb')); // Output: 'A#'
console.log(processor.normalizeNote('C')); // Output: 'C' (sin cambios)
```

### Ejemplo 2: Extraer acordes con posición

```typescript
const chordLine = 'C       Dm      G7      Am';
const chords = processor.extractChordsWithPosition(chordLine);

console.log(chords);
/* Output:
[
  { chord: 'C', charPosition: 0 },
  { chord: 'Dm', charPosition: 8 },
  { chord: 'G7', charPosition: 16 },
  { chord: 'Am', charPosition: 24 }
]
*/
```

### Ejemplo 3: Calcular posición de acorde (1-5)

```typescript
// Línea de 100 caracteres
const referenceLength = 100;

// Acorde al inicio (0-15%)
console.log(processor.calculateChordPosition(0, referenceLength)); // Output: 1
console.log(processor.calculateChordPosition(10, referenceLength)); // Output: 1

// Acorde en el centro (35-55%)
console.log(processor.calculateChordPosition(45, referenceLength)); // Output: 3

// Acorde al final (75-100%)
console.log(processor.calculateChordPosition(80, referenceLength)); // Output: 5
```

### Ejemplo 4: Parsear acorde completo

```typescript
// Acorde simple
const chord1 = processor.parseChord('C');
console.log(chord1);
// Output: { rootNote: 'C', chordQuality: '', slashChord: '' }

// Acorde con calidad
const chord2 = processor.parseChord('Cmaj7');
console.log(chord2);
// Output: { rootNote: 'C', chordQuality: 'maj7', slashChord: '' }

// Acorde con slash
const chord3 = processor.parseChord('C/G');
console.log(chord3);
// Output: { rootNote: 'C', chordQuality: '', slashChord: 'G' }

// Acorde complejo
const chord4 = processor.parseChord('Dm7/A');
console.log(chord4);
// Output: { rootNote: 'D', chordQuality: 'm7', slashChord: 'A' }

// Acorde inválido
const chord5 = processor.parseChord('X123');
console.log(chord5);
// Output: null
```

### Ejemplo 5: Redistribuir posiciones de acordes

```typescript
// Acordes con posiciones calculadas
const chordsWithCalculated = [
  { chord: 'C', charPosition: 0, calculatedPosition: 1 },
  { chord: 'D', charPosition: 5, calculatedPosition: 1 }, // Conflicto!
  { chord: 'E', charPosition: 10, calculatedPosition: 2 },
];

const redistributed = processor.redistributePositions(chordsWithCalculated);
console.log(redistributed);
/* Output:
[
  { chord: 'C', charPosition: 0, finalPosition: 1 },
  { chord: 'D', charPosition: 5, finalPosition: 2 }, // Movido!
  { chord: 'E', charPosition: 10, finalPosition: 3 }
]
*/
```

### Ejemplo 6: Optimizar distribución

```typescript
// 1 acorde
const oneChord = [{ chord: 'C', charPosition: 0, calculatedPosition: 1 }];
const opt1 = processor.optimizeDistribution(oneChord);
console.log(opt1[0].finalPosition); // Output: 3 (centro)

// 2 acordes
const twoChords = [
  { chord: 'C', charPosition: 0, calculatedPosition: 1 },
  { chord: 'G', charPosition: 10, calculatedPosition: 3 },
];
const opt2 = processor.optimizeDistribution(twoChords);
console.log(opt2.map((c) => c.finalPosition)); // Output: [2, 4]

// 3 acordes
const threeChords = [
  { chord: 'C', charPosition: 0, calculatedPosition: 1 },
  { chord: 'F', charPosition: 5, calculatedPosition: 2 },
  { chord: 'G', charPosition: 10, calculatedPosition: 3 },
];
const opt3 = processor.optimizeDistribution(threeChords);
console.log(opt3.map((c) => c.finalPosition)); // Output: [1, 3, 5]
```

### Ejemplo 7: Normalizar línea de acordes

```typescript
// Con guiones y espacios
const line1 = 'C - D - E - F';
console.log(processor.normalizeChordLine(line1));
// Output: 'C D E F'

// Sin espacios
const line2 = 'C-D-E-F';
console.log(processor.normalizeChordLine(line2));
// Output: 'C D E F'

// Espacios múltiples
const line3 = 'C    D    E';
console.log(processor.normalizeChordLine(line3));
// Output: 'C D E'
```

---

## 📖 LyricsParserService

### Ejemplo 1: Detectar estructuras

```typescript
import { LyricsParserService } from './services/lyrics-parser.service';
import { ChordProcessorService } from './services/chord-processor.service';

const chordProcessor = new ChordProcessorService();
const parser = new LyricsParserService(chordProcessor);

// Estructuras en inglés
console.log(parser.detectStructure('(verse)')); // Output: 2
console.log(parser.detectStructure('(chorus)')); // Output: 4
console.log(parser.detectStructure('(intro)')); // Output: 1
console.log(parser.detectStructure('(bridge)')); // Output: 5

// Estructuras en español
console.log(parser.detectStructure('(verso)')); // Output: 2
console.log(parser.detectStructure('(coro)')); // Output: 4
console.log(parser.detectStructure('(introduccion)')); // Output: 1

// Con números
console.log(parser.detectStructure('(verse 1)')); // Output: 2
console.log(parser.detectStructure('(coro 2)')); // Output: 4

// No estructura
console.log(parser.detectStructure('Just text')); // Output: null
```

### Ejemplo 2: Detectar si tiene acordes

```typescript
// Líneas con acordes
console.log(parser.hasChords('C D E F')); // Output: true
console.log(parser.hasChords('Am Dm G7')); // Output: true
console.log(parser.hasChords('C - D - E')); // Output: true
console.log(parser.hasChords('Cmaj7 Dm7 G7')); // Output: true

// Líneas sin acordes (letras)
console.log(parser.hasChords('Te alabo Señor')); // Output: false
console.log(parser.hasChords('Con todo mi corazón')); // Output: false
console.log(parser.hasChords('Aleluya aleluya gloria')); // Output: false
```

### Ejemplo 3: Validar máximo de acordes

```typescript
const lines1 = [
  '(verse)',
  'C D E F G', // 5 acordes - OK
  'Te alabo Señor',
  'Am Dm Em', // 3 acordes - OK
];

const validation1 = parser.validateMaxChordsPerLine(lines1, 5);
console.log(validation1);
// Output: { valid: true, errors: [] }

const lines2 = [
  'C D E F G A B', // 7 acordes - ERROR!
];

const validation2 = parser.validateMaxChordsPerLine(lines2, 5);
console.log(validation2);
/* Output: {
  valid: false,
  errors: ['Line 1 has 7 chords (max 5): "C D E F G A B"']
}
*/
```

### Ejemplo 4: Parsear contenido de archivo

```typescript
const fileContent = `
(verse)
C       D       E
Te alabo Señor

(chorus)
F       G       Am
Con todo mi corazón

`;

const { cleanedLines, lineMapping } = parser.parseFileContent(fileContent);

console.log(cleanedLines);
/* Output:
[
  '(verse)',
  'C       D       E',
  'Te alabo Señor',
  '(chorus)',
  'F       G       Am',
  'Con todo mi corazón'
]
*/

// Obtener línea original con espacios preservados
console.log(lineMapping.get(1));
// Output: 'C       D       E' (con espacios originales)
```

### Ejemplo 5: Obtener mapa de estructuras

```typescript
const structureMap = parser.getStructureMap();
console.log(structureMap);
/* Output:
{
  'intro': 1,
  'introduction': 1,
  'verse': 2,
  'verso': 2,
  'pre-chorus': 3,
  'chorus': 4,
  'coro': 4,
  'bridge': 5,
  'puente': 5,
  ...
}
*/
```

---

## 🏗️ Integración Completa

### Ejemplo: Procesamiento completo de un archivo

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

  async processLyricsFile(fileContent: string) {
    // 1. Parsear archivo
    const { cleanedLines, lineMapping } =
      this.lyricsParser.parseFileContent(fileContent);

    // 2. Validar
    const validation = this.lyricsParser.validateMaxChordsPerLine(cleanedLines);
    if (!validation.valid) {
      throw new Error(validation.errors.join('\n'));
    }

    // 3. Procesar cada línea
    const results = [];
    let currentStructure = 2; // Verso por defecto

    for (let i = 0; i < cleanedLines.length; i++) {
      const line = cleanedLines[i];

      // Detectar estructura
      const structureId = this.lyricsParser.detectStructure(line);
      if (structureId !== null) {
        currentStructure = structureId;
        continue;
      }

      // Procesar acordes y letras
      const hasChords = this.lyricsParser.hasChords(line);

      if (hasChords) {
        const originalLine = lineMapping.get(i) || line;
        const chords =
          this.chordProcessor.extractChordsWithPosition(originalLine);

        // Obtener letra de la siguiente línea
        const nextLine = cleanedLines[i + 1];
        if (nextLine && !this.lyricsParser.hasChords(nextLine)) {
          const normalizedLyrics = this.lyricsNormalizer.normalize(nextLine);

          // Calcular posiciones de acordes
          const chordsWithPositions = chords.map(({ chord, charPosition }) => ({
            chord,
            charPosition,
            calculatedPosition: this.chordProcessor.calculateChordPosition(
              charPosition,
              originalLine.length,
            ),
          }));

          // Redistribuir
          const finalChords =
            this.chordProcessor.redistributePositions(chordsWithPositions);

          // Parsear cada acorde
          const parsedChords = finalChords
            .map(({ chord, finalPosition }) => ({
              ...this.chordProcessor.parseChord(chord),
              position: finalPosition,
            }))
            .filter((c) => c.rootNote); // Filtrar inválidos

          results.push({
            structureId: currentStructure,
            lyrics: normalizedLyrics,
            chords: parsedChords,
          });

          i++; // Saltar la línea de letra
        }
      } else {
        // Solo letra, sin acordes
        const normalizedLyrics = this.lyricsNormalizer.normalize(line);
        results.push({
          structureId: currentStructure,
          lyrics: normalizedLyrics,
          chords: [],
        });
      }
    }

    return results;
  }
}
```

### Ejemplo de resultado:

```typescript
const result = await myService.processLyricsFile(fileContent);
console.log(result);
/* Output:
[
  {
    structureId: 2, // Verso
    lyrics: "Te alabo Señor con todo mi corazón",
    chords: [
      { rootNote: 'C', chordQuality: '', slashChord: '', position: 1 },
      { rootNote: 'D', chordQuality: '', slashChord: '', position: 3 },
      { rootNote: 'E', chordQuality: '', slashChord: '', position: 5 }
    ]
  },
  {
    structureId: 4, // Coro
    lyrics: "Porque Tú eres Dios",
    chords: [
      { rootNote: 'F', chordQuality: '', slashChord: '', position: 2 },
      { rootNote: 'G', chordQuality: '', slashChord: '', position: 4 }
    ]
  }
]
*/
```

---

## 🧪 Ejemplos en Tests

### Test unitario simple

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { LyricsNormalizerService } from './lyrics-normalizer.service';

describe('LyricsNormalizerService', () => {
  let service: LyricsNormalizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LyricsNormalizerService],
    }).compile();

    service = module.get<LyricsNormalizerService>(LyricsNormalizerService);
  });

  it('should capitalize divine words', () => {
    const input = 'te alabamos señor jesús';
    const result = service.normalize(input);

    expect(result).toContain('Señor');
    expect(result).toContain('Jesús');
  });
});
```

---

## 💡 Tips y Best Practices

### 1. Inyección de Dependencias

Siempre usa inyección de dependencias en lugar de instanciar directamente:

```typescript
// ❌ NO hacer esto
const normalizer = new LyricsNormalizerService();

// ✅ Hacer esto
constructor(private lyricsNormalizer: LyricsNormalizerService) {}
```

### 2. Manejo de Errores

Siempre valida antes de procesar:

```typescript
// Validar primero
const validation = parser.validateMaxChordsPerLine(lines);
if (!validation.valid) {
  throw new Error(validation.errors.join('\n'));
}

// Luego procesar
const result = await processLines(lines);
```

### 3. Tests

Escribe tests para cada caso de uso:

```typescript
it('should handle empty string', () => {
  expect(service.normalize('')).toBe('');
});

it('should handle null', () => {
  expect(service.normalize(null as any)).toBe(null);
});
```

---

## 📚 Recursos Adicionales

- [Documentación Completa](./SONGS_LYRICS_REFACTORING.md)
- [Índice de Archivos](./SONGS_LYRICS_INDEX.md)
- [Resumen Ejecutivo](./SONGS_LYRICS_REFACTORING_SUMMARY.md)

---

**Última actualización**: Noviembre 2025  
**Estado**: ✅ Listo para usar  
**Tests**: 65/65 pasando 🎉
