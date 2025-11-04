import { Injectable } from '@nestjs/common';

export interface ChordWithPosition {
  chord: string;
  charPosition: number;
}

export interface ChordWithCalculatedPosition extends ChordWithPosition {
  calculatedPosition: number;
}

export interface ChordWithFinalPosition {
  chord: string;
  charPosition: number;
  finalPosition: number;
}

export interface ParsedChord {
  rootNote: string;
  chordQuality: string;
  slashChord: string;
}

@Injectable()
export class ChordProcessorService {
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

  /**
   * Convierte bemoles a sostenidos
   */
  normalizeNote(note: string): string {
    return this.flatToSharpMap[note] || note;
  }

  /**
   * Normaliza acordes separados por guiones
   * Convierte "G - F - A" o "F-A-G" a "G F A" o "F A G"
   */
  normalizeChordLine(line: string): string {
    return line
      .replace(/\s*-\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extrae acordes con su posición en la línea original
   */
  extractChordsWithPosition(chordsLine: string): ChordWithPosition[] {
    const chordPattern =
      /[A-G][#b]?(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?(\/[A-G][#b]?(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?)?/g;

    const chordsWithPosition: ChordWithPosition[] = [];
    let match;

    while ((match = chordPattern.exec(chordsLine)) !== null) {
      chordsWithPosition.push({
        chord: match[0],
        charPosition: match.index,
      });
    }

    return chordsWithPosition;
  }

  /**
   * Calcula la posición del acorde (1-5) basada en su ubicación
   */
  calculateChordPosition(
    charPosition: number,
    referenceLength: number,
  ): number {
    if (referenceLength === 0) return 1;

    // Calcular el porcentaje de posición en la línea
    const percentage = (charPosition / referenceLength) * 100;

    // Mapear el porcentaje a una posición de 1 a 5
    if (percentage < 15) return 1; // 0-15% = Inicio
    if (percentage < 35) return 2; // 15-35% = Inicio-medio
    if (percentage < 55) return 3; // 35-55% = Centro
    if (percentage < 75) return 4; // 55-75% = Medio-final
    return 5; // 75-100% = Final
  }

  /**
   * Redistribuye posiciones para evitar duplicados
   * Mantiene el orden original de los acordes
   */
  redistributePositions(
    chordsWithPositions: ChordWithCalculatedPosition[],
  ): ChordWithFinalPosition[] {
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

  /**
   * Comprime acordes cuando no hay espacio disponible
   */
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

  /**
   * Optimiza la distribución de acordes en posiciones 1-5
   */
  optimizeDistribution(
    chordsWithPositions: ChordWithCalculatedPosition[],
  ): ChordWithFinalPosition[] {
    const count = chordsWithPositions.length;

    const result: ChordWithFinalPosition[] = [];

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

  /**
   * Parsea un acorde en sus componentes (nota raíz, calidad, slash)
   * Retorna null si el acorde no es válido
   */
  parseChord(chord: string): ParsedChord | null {
    const match = chord.match(
      /^([A-G][#b]?)(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?(\/([A-G][#b]?)(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?)?$/,
    );

    if (!match) return null;

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
      return {
        rootNote,
        chordQuality: chordQuality || '',
        slashChord: slashRoot || '',
      };
    }

    return null;
  }

  /**
   * Obtiene las notas raíz válidas (útil para testing)
   */
  getRootNotes(): string[] {
    return [...this.rootNotes];
  }

  /**
   * Obtiene las calidades de acordes válidas (útil para testing)
   */
  getChordQualities(): string[] {
    return [...this.chordQualities];
  }
}
