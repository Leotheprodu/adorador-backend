import { Injectable } from '@nestjs/common';
import { CreateSongsLyricDto } from './dto/create-songs-lyric.dto';
import { UpdateSongsLyricDto } from './dto/update-songs-lyric.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SongsLyricsService {
  constructor(private prisma: PrismaService) {}

  private readonly rootNotes = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ];

  // Mapeo de bemoles a sostenidos
  private readonly flatToSharpMap: { [key: string]: string } = {
    Cb: 'B',
    Db: 'C#',
    Eb: 'D#',
    Fb: 'E',
    Gb: 'F#',
    Ab: 'G#',
    Bb: 'A#',
  };

  // Mapeo de estructuras en español e inglés a IDs
  private readonly structureMap: { [key: string]: number } = {
    // Inglés
    intro: 1,
    introduction: 1,
    verse: 2,
    'pre-chorus': 3,
    prechorus: 3,
    chorus: 4,
    refrain: 4, // Refrain = Chorus
    bridge: 5,
    interlude: 6,
    solo: 7,
    outro: 8,
    // Español
    introduccion: 1,
    verso: 2,
    'pre-coro': 3,
    precoro: 3,
    coro: 4,
    estribillo: 4, // Estribillo = Coro
    puente: 5,
    interludio: 6,
    final: 8,
    salida: 8,
    intermedio: 7,
  };

  private readonly chordQualities = [
    'maj7',
    'mMaj7',
    'dim7',
    'm7b5',
    'maj9',
    'maj11',
    'maj13',
    'sus4',
    'sus2',
    'aug',
    'dim',
    'm13',
    'm11',
    'm9',
    'm7',
    '7',
    '9',
    '11',
    '13',
    'm',
    '',
  ];

  async create(data: CreateSongsLyricDto, songId: number) {
    return await this.prisma.songs_lyrics.create({
      data: { ...data, songId },
    });
  }

  async findAll(songId: number) {
    return await this.prisma.songs_lyrics.findMany({
      where: { songId },
      select: {
        id: true,
        position: true,
        lyrics: true,
        structure: {
          select: {
            id: true,
            title: true,
          },
        },
        chords: {
          omit: {
            updatedAt: true,
            createdAt: true,
            lyricId: true,
          },
        },
      },
    });
  }

  async findOne(id: number, songId: number) {
    return await this.prisma.songs_lyrics.findUnique({
      where: { id, songId },
    });
  }

  async update(
    id: number,
    songId: number,
    updateSongsLyricDto: UpdateSongsLyricDto,
  ) {
    return await this.prisma.songs_lyrics.update({
      where: { id, songId },
      data: updateSongsLyricDto,
    });
  }

  async updateArrayOfLyrics(songId: number, lyrics: UpdateSongsLyricDto[]) {
    const updatePromises = lyrics.map((lyric) =>
      this.prisma.songs_lyrics.update({
        where: { id: lyric.id, songId },
        data: { position: lyric.position },
      }),
    );
    return await Promise.all(updatePromises);
  }

  async remove(id: number, songId: number) {
    const chords = await this.prisma.songs_Chords.findMany({
      where: { lyricId: id },
    });
    if (chords.length > 0) {
      await this.prisma.songs_Chords.deleteMany({
        where: { lyricId: id },
      });
    }
    return await this.prisma.songs_lyrics.delete({
      where: { id, songId },
    });
  }

  // Función para convertir bemoles a sostenidos
  private normalizeNote(note: string): string {
    return this.flatToSharpMap[note] || note;
  }

  // Función para normalizar y limpiar las letras
  private normalizeLyrics(lyrics: string): string {
    if (!lyrics || lyrics.trim().length === 0) return lyrics;

    let normalized = lyrics.trim();

    // Eliminar caracteres no permitidos (mantener solo letras, números, espacios, ¡!¿?)
    // Eliminar: . () * / \ " ' , ; : - _ = + [ ] { } < > | ~ ` @ # $ % ^ &
    normalized = normalized.replace(
      /[().*\/\\"',;:\-_=+\[\]{}<>|~`@#$%^&]/g,
      '',
    );

    // Eliminar múltiples espacios
    normalized = normalized.replace(/\s+/g, ' ').trim();

    // Convertir todo a minúsculas primero
    normalized = normalized.toLowerCase();

    // Capitalizar la primera letra de la línea
    if (normalized.length > 0) {
      normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }

    // Lista de palabras relacionadas con Dios que deben ir en mayúscula
    const divineWords = [
      'dios',
      'señor',
      'padre',
      'hijo',
      'santo',
      'espíritu santo',
      'espiritu santo',
      'jesús',
      'jesus',
      'jeshua',
      'yeshua',
      'cristo',
      'jesucristo',
      'salvador',
      'mesías',
      'mesías',
      'emanuel',
      'emmanuel',
      'jehová',
      'jehova',
      'yahveh',
      'yahweh',
      'adonai',
      'elohim',
      'el shaddai',
      'altísimo',
      'altisimo',
      'todopoderoso',
      'omnipotente',
      'creador',
      'redentor',
      'cordero',
      'rey de reyes',
      'león de judá',
      'alfa y omega',
    ];

    // Capitalizar palabras divinas (incluyendo frases)
    for (const word of divineWords) {
      // Buscar la palabra completa (no como parte de otra palabra)
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      normalized = normalized.replace(regex, (match) => {
        // Capitalizar cada palabra de la frase
        return match
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      });
    }

    return normalized;
  }

  // Función para detectar y mapear la estructura
  private detectStructure(line: string): number | null {
    const structureMatch = line.match(/^\(([^)]+)\)$/);
    if (!structureMatch) return null;

    let structureName = structureMatch[1]
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Eliminar acentos

    // Eliminar números y espacios extras (ej: "verso 1", "coro 2", "verse1")
    structureName = structureName.replace(/\s*\d+\s*$/, '').replace(/\d+$/, '');

    // Eliminar espacios internos (ej: "pre coro" -> "precoro")
    const normalizedWithoutSpaces = structureName.replace(/\s+/g, '');

    // Buscar primero con espacios (para "pre-coro") y luego sin espacios
    return (
      this.structureMap[structureName] ||
      this.structureMap[normalizedWithoutSpaces] ||
      null
    );
  }

  // Función para detectar si una línea contiene acordes
  private hasChords(line: string): boolean {
    // Patrón más estricto: acordes deben estar separados por espacios o al inicio/fin
    // y no formar parte de palabras
    const chordPattern =
      /(?:^|\s)([A-G][#b]?(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?(\/[A-G][#b]?(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?)?)(?:\s|$|-)/;

    // Verificar que la línea no sea principalmente texto
    // Si tiene más de 3 palabras consecutivas sin acordes, probablemente es letra
    const words = line.trim().split(/\s+/);
    if (words.length > 0) {
      // Contar cuántas "palabras" son potencialmente acordes
      let potentialChords = 0;
      for (const word of words) {
        const cleanWord = word.replace(/[-\s]/g, '');
        if (
          /^[A-G][#b]?(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?(\/[A-G][#b]?)?$/.test(
            cleanWord,
          )
        ) {
          potentialChords++;
        }
      }

      // Si al menos el 50% son acordes y hay menos de 6 palabras, es línea de acordes
      // Esto evita detectar letras como "De tu amor" como acordes
      if (words.length <= 6) {
        return potentialChords >= words.length * 0.5;
      }
    }

    return chordPattern.test(line);
  }

  // Función para normalizar acordes separados por guiones
  // Convierte "G - F - A" o "F-A-G" a "G F A" o "F A G"
  private normalizeChordLine(line: string): string {
    // Reemplazar guiones con o sin espacios por un solo espacio
    return line
      .replace(/\s*-\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Función para extraer acordes con su posición en la línea original
  private extractChordsWithPosition(chordsLine: string): Array<{
    chord: string;
    charPosition: number;
  }> {
    const chordPattern =
      /[A-G][#b]?(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?(\/[A-G][#b]?(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?)?/g;

    const chordsWithPosition: Array<{ chord: string; charPosition: number }> =
      [];
    let match;

    while ((match = chordPattern.exec(chordsLine)) !== null) {
      chordsWithPosition.push({
        chord: match[0],
        charPosition: match.index,
      });
    }

    return chordsWithPosition;
  }

  // Función para calcular la posición del acorde (1-5) basada en su ubicación
  private calculateChordPosition(
    charPosition: number,
    referenceLength: number,
  ): number {
    if (referenceLength === 0) return 1;

    // Calcular el porcentaje de posición en la línea
    const percentage = (charPosition / referenceLength) * 100;

    // Mapear el porcentaje a una posición de 1 a 5 con rangos ajustados
    // Más precisos para distribución en 5 posiciones
    if (percentage < 15) return 1; // 0-15% = Inicio
    if (percentage < 35) return 2; // 15-35% = Inicio-medio
    if (percentage < 55) return 3; // 35-55% = Centro
    if (percentage < 75) return 4; // 55-75% = Medio-final
    return 5; // 75-100% = Final
  }

  // Función para redistribuir posiciones y evitar duplicados
  // IMPORTANTE: Mantiene el orden original de los acordes
  private redistributePositions(
    chordsWithPositions: Array<{
      chord: string;
      charPosition: number;
      calculatedPosition: number;
    }>,
  ): Array<{ chord: string; charPosition: number; finalPosition: number }> {
    // Si no hay acordes, retornar vacío
    if (chordsWithPositions.length === 0) return [];

    // Ordenar por posición en caracteres (orden de aparición en el archivo)
    const sorted = [...chordsWithPositions].sort(
      (a, b) => a.charPosition - b.charPosition,
    );

    // Asignar posiciones iniciales calculadas
    const assignments = sorted.map((item, index) => ({
      ...item,
      index,
      finalPosition: item.calculatedPosition,
    }));

    // Detectar y resolver conflictos manteniendo el orden
    let hasConflict = true;
    while (hasConflict) {
      hasConflict = false;
      const usedPositions = new Map<number, number>(); // posición -> índice del acorde

      for (let i = 0; i < assignments.length; i++) {
        const currentPos = assignments[i].finalPosition;

        if (usedPositions.has(currentPos)) {
          // Hay conflicto: dos acordes quieren la misma posición
          hasConflict = true;
          const conflictIndex = usedPositions.get(currentPos)!;

          // El acorde que viene DESPUÉS debe moverse hacia adelante
          // Buscar la siguiente posición disponible
          let newPos = currentPos + 1;
          while (
            newPos <= 5 &&
            Array.from(usedPositions.keys()).includes(newPos)
          ) {
            newPos++;
          }

          if (newPos <= 5) {
            assignments[i].finalPosition = newPos;
          } else {
            // No hay espacio adelante, necesitamos comprimir todos hacia atrás
            this.compressPositions(assignments);
            hasConflict = false; // La compresión resuelve todos los conflictos
            break;
          }
        }

        usedPositions.set(currentPos, i);
      }
    }

    return assignments.map(({ chord, charPosition, finalPosition }) => ({
      chord,
      charPosition,
      finalPosition,
    }));
  }

  // Función para comprimir acordes cuando no hay espacio
  private compressPositions(
    assignments: Array<{
      chord: string;
      charPosition: number;
      calculatedPosition: number;
      index: number;
      finalPosition: number;
    }>,
  ): void {
    const count = assignments.length;

    // Distribuir equitativamente en las 5 posiciones
    for (let i = 0; i < count; i++) {
      // Calcular posición proporcional
      const position = Math.ceil(((i + 1) / count) * 5);
      assignments[i].finalPosition = Math.max(1, Math.min(5, position));
    }

    // Asegurar que no haya duplicados después de la compresión
    const used = new Set<number>();
    for (let i = 0; i < assignments.length; i++) {
      let pos = assignments[i].finalPosition;

      // Si está ocupado, buscar el siguiente disponible
      while (used.has(pos) && pos <= 5) {
        pos++;
      }

      if (pos > 5) {
        // Buscar hacia atrás desde la posición original
        pos = assignments[i].finalPosition - 1;
        while (pos >= 1 && used.has(pos)) {
          pos--;
        }
      }

      assignments[i].finalPosition = pos;
      used.add(pos);
    }
  }

  // Función para optimizar la distribución de acordes en posiciones 1-5
  private optimizeDistribution(
    chordsWithPositions: Array<{
      chord: string;
      charPosition: number;
      calculatedPosition: number;
    }>,
  ): Array<{ chord: string; charPosition: number; finalPosition: number }> {
    const count = chordsWithPositions.length;

    // Casos especiales para distribución óptima
    const result: Array<{
      chord: string;
      charPosition: number;
      finalPosition: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      let finalPosition: number;

      switch (count) {
        case 1:
          finalPosition = 3; // Centro
          break;
        case 2:
          finalPosition = i === 0 ? 2 : 4; // Distribuir en 2 y 4
          break;
        case 3:
          finalPosition = i === 0 ? 1 : i === 1 ? 3 : 5; // 1, 3, 5
          break;
        case 4:
          finalPosition = i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 4 : 5; // 1, 2, 4, 5
          break;
        case 5:
          finalPosition = i + 1; // 1, 2, 3, 4, 5
          break;
        default:
          finalPosition = chordsWithPositions[i].calculatedPosition;
      }

      result.push({
        chord: chordsWithPositions[i].chord,
        charPosition: chordsWithPositions[i].charPosition,
        finalPosition,
      });
    }

    return result;
  }

  // Función para validar que no haya más de 5 acordes por línea
  private validateMaxChordsPerLine(lines: string[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxChordsPerLine = 5;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Ignorar estructuras
      if (this.detectStructure(line) !== null) continue;

      // Verificar si tiene acordes
      if (this.hasChords(line)) {
        const normalizedLine = this.normalizeChordLine(line);
        const chordsWithPosition =
          this.extractChordsWithPosition(normalizedLine);

        if (chordsWithPosition.length > maxChordsPerLine) {
          errors.push(
            `Line ${i + 1} has ${chordsWithPosition.length} chords (max ${maxChordsPerLine}): "${line}"`,
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async parseAndSaveLyricsWithChords(fileBuffer: Buffer, songId: number) {
    const fileContent = fileBuffer.toString('utf-8');

    // Guardar líneas originales (sin trim) para cálculo de posiciones
    const originalLines = fileContent.split(/\r?\n/);

    // Eliminar líneas en blanco y normalizar saltos de línea
    const lines = fileContent
      .split(/\r?\n/) // Soporta tanto \n como \r\n
      .map((line) => line.trim()) // Eliminar espacios al inicio y final
      .filter((line) => line.length > 0); // Filtrar líneas vacías

    // Crear mapeo de índices: línea limpia -> línea original
    const lineToOriginalMap = new Map<number, string>();
    let cleanIndex = 0;
    for (let i = 0; i < originalLines.length; i++) {
      const trimmed = originalLines[i].trim();
      if (trimmed.length > 0) {
        lineToOriginalMap.set(cleanIndex, originalLines[i]);
        cleanIndex++;
      }
    }

    // Validar que no haya más de 5 acordes por línea
    const validation = this.validateMaxChordsPerLine(lines);
    if (!validation.valid) {
      throw new Error(
        `File validation failed:\n${validation.errors.join('\n')}`,
      );
    }

    let position = 1;
    let currentStructureId = 2; // Default: verse

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Verificar si es una línea de estructura
      const structureId = this.detectStructure(line);
      if (structureId !== null) {
        currentStructureId = structureId;
        continue; // Saltar al siguiente ciclo
      }

      // Verificar si la línea actual tiene acordes
      const currentLineHasChords = this.hasChords(line);
      const nextLine = lines[i + 1];
      const nextLineIsStructure = nextLine
        ? this.detectStructure(nextLine) !== null
        : false;

      // CASO 1: Solo letra (sin acordes)
      if (!currentLineHasChords) {
        // Si la siguiente línea es una estructura, ignorar esta línea
        if (nextLineIsStructure) {
          continue;
        }

        // Es una línea de letra sin acordes - normalizar antes de guardar
        const normalizedLyrics = this.normalizeLyrics(line);

        await this.prisma.songs_lyrics.create({
          data: {
            songId,
            lyrics: normalizedLyrics,
            position,
            structureId: currentStructureId,
          },
        });

        position++;
        continue;
      }

      // CASO 2: Línea con acordes
      const chordsLine = line;
      let lyricsLine = nextLine?.trim() || '';

      // Si la siguiente línea es estructura o no existe, esta línea de acordes no tiene letra
      if (!lyricsLine || nextLineIsStructure) {
        // Línea solo con acordes, sin letra (skip o crear vacía si prefieres)
        continue;
      }

      // Verificar si la línea de letra también tiene acordes (caso raro)
      const nextLineHasChords = this.hasChords(lyricsLine);
      if (nextLineHasChords) {
        // La "letra" también tiene acordes, tratar la línea actual como solo letra
        await this.prisma.songs_lyrics.create({
          data: {
            songId,
            lyrics: line,
            position,
            structureId: currentStructureId,
          },
        });

        position++;
        continue;
      }

      // CASO 3: Acordes + Letra (formato normal)
      // Usar la línea ORIGINAL (sin trim) para calcular posiciones correctas
      const originalChordsLine = lineToOriginalMap.get(i) || chordsLine;
      const originalLyricsLine = lineToOriginalMap.get(i + 1) || lyricsLine;

      // Extraer acordes con su posición en la línea original (con espacios intactos)
      const chordsWithPosition =
        this.extractChordsWithPosition(originalChordsLine);

      // Normalizar la letra antes de guardar
      const normalizedLyrics = this.normalizeLyrics(lyricsLine);

      const lyric = await this.prisma.songs_lyrics.create({
        data: {
          songId,
          lyrics: normalizedLyrics,
          position,
          structureId: currentStructureId,
        },
      });

      i++; // Saltar la línea de letra ya que ya la procesamos

      if (chordsWithPosition.length > 0) {
        // Usar la mayor longitud entre la línea de acordes ORIGINAL y la letra ORIGINAL
        // Esto permite calcular dónde cae el acorde en relación a la letra
        const referenceLength = Math.max(
          originalChordsLine.length,
          originalLyricsLine.length,
        );

        // Calcular posiciones iniciales para todos los acordes
        const chordsWithCalculatedPositions = chordsWithPosition.map(
          ({ chord, charPosition }) => ({
            chord,
            charPosition,
            calculatedPosition: this.calculateChordPosition(
              charPosition,
              referenceLength,
            ),
          }),
        );

        // Redistribuir posiciones para evitar duplicados
        const chordsWithFinalPositions = this.redistributePositions(
          chordsWithCalculatedPositions,
        );

        // Guardar los acordes con sus posiciones finales
        for (const {
          chord,
          charPosition,
          finalPosition,
        } of chordsWithFinalPositions) {
          const match = chord.match(
            /^([A-G][#b]?)(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?(\/([A-G][#b]?)(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?)?$/,
          );

          if (match) {
            let [_, rootNote, chordQuality, __, slashRoot] = match;

            // Normalizar bemoles a sostenidos
            rootNote = this.normalizeNote(rootNote);
            if (slashRoot) {
              slashRoot = this.normalizeNote(slashRoot);
            }

            // Validar valores contra enums
            if (
              this.rootNotes.includes(rootNote) &&
              (!chordQuality || this.chordQualities.includes(chordQuality)) &&
              (!slashRoot || this.rootNotes.includes(slashRoot))
            ) {
              await this.prisma.songs_Chords.create({
                data: {
                  lyricId: lyric.id,
                  rootNote,
                  chordQuality: chordQuality || '',
                  slashChord: slashRoot || '',
                  position: finalPosition, // Usar posición redistribuida
                },
              });
            }
          }
        }
      }

      position++;
    }

    return {
      message:
        'Lyrics and chords processed with validated notes and qualities!',
    };
  }
}
