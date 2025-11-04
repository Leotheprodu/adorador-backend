import { Injectable } from '@nestjs/common';

@Injectable()
export class LyricsNormalizerService {
  private readonly divineWords = [
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

  /**
   * Normaliza y limpia el texto de las letras de canciones
   * - Elimina caracteres no permitidos
   * - Normaliza espacios
   * - Capitaliza la primera letra
   * - Capitaliza palabras divinas
   */
  normalize(lyrics: string): string {
    if (!lyrics || lyrics.trim().length === 0) return lyrics;

    let normalized = lyrics.trim();

    // Eliminar caracteres no permitidos (mantener solo letras, números, espacios, ¡!¿?)
    normalized = this.removeInvalidCharacters(normalized);

    // Eliminar múltiples espacios
    normalized = this.normalizeSpaces(normalized);

    // Convertir todo a minúsculas primero
    normalized = normalized.toLowerCase();

    // Capitalizar la primera letra de la línea
    normalized = this.capitalizeFirstLetter(normalized);

    // Capitalizar palabras divinas
    normalized = this.capitalizeDivineWords(normalized);

    return normalized;
  }

  /**
   * Elimina caracteres no permitidos del texto
   */
  private removeInvalidCharacters(text: string): string {
    // Eliminar: . () * / \ " ' , ; : - _ = + [ ] { } < > | ~ ` @ # $ % ^ &
    return text.replace(/[().*\/\\"',;:\-_=+\[\]{}<>|~`@#$%^&]/g, '');
  }

  /**
   * Normaliza los espacios (elimina múltiples espacios consecutivos)
   */
  private normalizeSpaces(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Capitaliza la primera letra del texto
   */
  private capitalizeFirstLetter(text: string): string {
    if (text.length === 0) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Capitaliza palabras relacionadas con Dios en el texto
   */
  private capitalizeDivineWords(text: string): string {
    let result = text;

    for (const word of this.divineWords) {
      // Buscar la palabra completa (no como parte de otra palabra)
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      result = result.replace(regex, (match) => {
        // Capitalizar cada palabra de la frase
        return match
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      });
    }

    return result;
  }

  /**
   * Obtiene la lista de palabras divinas (útil para testing)
   */
  getDivineWords(): string[] {
    return [...this.divineWords];
  }
}
