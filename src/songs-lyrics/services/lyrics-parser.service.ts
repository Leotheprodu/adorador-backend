import { Injectable } from '@nestjs/common';
import { ChordProcessorService } from './chord-processor.service';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface LineMapping {
  cleanIndex: number;
  originalLine: string;
}

@Injectable()
export class LyricsParserService {
  constructor(private readonly chordProcessor: ChordProcessorService) {}

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

  /**
   * Detecta y mapea la estructura de una línea
   * Retorna el ID de la estructura o null si no es una línea de estructura
   */
  detectStructure(line: string): number | null {
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

  /**
   * Detecta si una línea contiene acordes
   */
  hasChords(line: string): boolean {
    // Patrón más estricto: acordes deben estar separados por espacios o al inicio/fin
    const chordPattern =
      /(?:^|\s)([A-G][#b]?(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?(\/[A-G][#b]?(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?)?)(?:\s|$|-)/;

    // Verificar que la línea no sea principalmente texto
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
      if (words.length <= 6) {
        return potentialChords >= words.length * 0.5;
      }
    }

    return chordPattern.test(line);
  }

  /**
   * Valida que no haya más de 5 acordes por línea
   */
  validateMaxChordsPerLine(
    lines: string[],
    maxChords: number = 5,
  ): ValidationResult {
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Ignorar estructuras
      if (this.detectStructure(line) !== null) continue;

      // Verificar si tiene acordes
      if (this.hasChords(line)) {
        const normalizedLine = this.chordProcessor.normalizeChordLine(line);
        const chordsWithPosition =
          this.chordProcessor.extractChordsWithPosition(normalizedLine);

        if (chordsWithPosition.length > maxChords) {
          errors.push(
            `Line ${i + 1} has ${chordsWithPosition.length} chords (max ${maxChords}): "${line}"`,
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parsea el contenido del archivo en líneas limpias
   * Elimina líneas en blanco y normaliza saltos de línea
   */
  parseFileContent(fileContent: string): {
    cleanedLines: string[];
    lineMapping: Map<number, string>;
  } {
    // Guardar líneas originales (sin trim) para cálculo de posiciones
    const originalLines = fileContent.split(/\r?\n/);

    // Eliminar líneas en blanco y normalizar
    const cleanedLines = fileContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Crear mapeo de índices: línea limpia -> línea original
    const lineMapping = new Map<number, string>();
    let cleanIndex = 0;
    for (let i = 0; i < originalLines.length; i++) {
      const trimmed = originalLines[i].trim();
      if (trimmed.length > 0) {
        lineMapping.set(cleanIndex, originalLines[i]);
        cleanIndex++;
      }
    }

    return { cleanedLines, lineMapping };
  }

  /**
   * Obtiene el mapa de estructuras (útil para testing)
   */
  getStructureMap(): { [key: string]: number } {
    return { ...this.structureMap };
  }
}
