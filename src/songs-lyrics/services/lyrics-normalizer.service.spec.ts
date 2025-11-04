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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalize', () => {
    it('should return empty string for empty input', () => {
      expect(service.normalize('')).toBe('');
      expect(service.normalize('   ')).toBe('   ');
    });

    it('should remove invalid characters', () => {
      const input = 'Hola (mundo) con "comillas" y {llaves}';
      const result = service.normalize(input);
      expect(result).not.toContain('(');
      expect(result).not.toContain(')');
      expect(result).not.toContain('"');
      expect(result).not.toContain('{');
      expect(result).not.toContain('}');
    });

    it('should normalize multiple spaces', () => {
      const input = 'Hola    mundo    con     espacios';
      const result = service.normalize(input);
      expect(result).toBe('Hola mundo con espacios');
    });

    it('should capitalize first letter', () => {
      const input = 'hola mundo';
      const result = service.normalize(input);
      expect(result.charAt(0)).toBe('H');
    });

    it('should capitalize divine words', () => {
      const input = 'te alabamos señor jesús';
      const result = service.normalize(input);
      expect(result).toContain('Señor');
      expect(result).toContain('Jesús');
    });

    it('should capitalize multi-word divine phrases', () => {
      const input = 'eres el espíritu santo';
      const result = service.normalize(input);
      expect(result).toContain('Espíritu Santo');
    });

    it('should handle complex lyrics', () => {
      const input = 'alabamos a dios, padre todopoderoso!!!';
      const result = service.normalize(input);

      // Debe capitalizar las palabras divinas
      expect(result).toContain('Dios');
      expect(result).toContain('Padre');
      expect(result).toContain('Todopoderoso');

      // Debe eliminar las comas
      expect(result).not.toContain(',');
    });
  });

  describe('getDivineWords', () => {
    it('should return a copy of divine words list', () => {
      const words = service.getDivineWords();
      expect(words).toBeInstanceOf(Array);
      expect(words.length).toBeGreaterThan(0);
      expect(words).toContain('dios');
      expect(words).toContain('jesús');
    });

    it('should return a copy, not reference', () => {
      const words1 = service.getDivineWords();
      const words2 = service.getDivineWords();
      expect(words1).not.toBe(words2);
      expect(words1).toEqual(words2);
    });
  });
});
