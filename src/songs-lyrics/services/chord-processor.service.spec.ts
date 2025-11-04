import { Test, TestingModule } from '@nestjs/testing';
import { ChordProcessorService } from './chord-processor.service';

describe('ChordProcessorService', () => {
  let service: ChordProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChordProcessorService],
    }).compile();

    service = module.get<ChordProcessorService>(ChordProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizeNote', () => {
    it('should convert flats to sharps', () => {
      expect(service.normalizeNote('Db')).toBe('C#');
      expect(service.normalizeNote('Eb')).toBe('D#');
      expect(service.normalizeNote('Gb')).toBe('F#');
      expect(service.normalizeNote('Ab')).toBe('G#');
      expect(service.normalizeNote('Bb')).toBe('A#');
    });

    it('should return same note if not flat', () => {
      expect(service.normalizeNote('C')).toBe('C');
      expect(service.normalizeNote('D#')).toBe('D#');
      expect(service.normalizeNote('F')).toBe('F');
    });
  });

  describe('normalizeChordLine', () => {
    it('should replace dashes with spaces', () => {
      const input = 'C - D - E';
      const result = service.normalizeChordLine(input);
      expect(result).toBe('C D E');
    });

    it('should handle dashes without spaces', () => {
      const input = 'C-D-E';
      const result = service.normalizeChordLine(input);
      expect(result).toBe('C D E');
    });

    it('should normalize multiple spaces', () => {
      const input = 'C    D    E';
      const result = service.normalizeChordLine(input);
      expect(result).toBe('C D E');
    });
  });

  describe('extractChordsWithPosition', () => {
    it('should extract simple chords', () => {
      const input = 'C D E F';
      const result = service.extractChordsWithPosition(input);
      expect(result).toHaveLength(4);
      expect(result[0].chord).toBe('C');
      expect(result[1].chord).toBe('D');
      expect(result[2].chord).toBe('E');
      expect(result[3].chord).toBe('F');
    });

    it('should extract chords with qualities', () => {
      const input = 'Cmaj7 Dm7 E7';
      const result = service.extractChordsWithPosition(input);
      expect(result).toHaveLength(3);
      expect(result[0].chord).toBe('Cmaj7');
      expect(result[1].chord).toBe('Dm7');
      expect(result[2].chord).toBe('E7');
    });

    it('should extract slash chords', () => {
      const input = 'C/G D/F#';
      const result = service.extractChordsWithPosition(input);
      expect(result).toHaveLength(2);
      expect(result[0].chord).toBe('C/G');
      expect(result[1].chord).toBe('D/F#');
    });

    it('should track character positions', () => {
      const input = 'C   D   E';
      const result = service.extractChordsWithPosition(input);
      expect(result[0].charPosition).toBe(0);
      expect(result[1].charPosition).toBe(4);
      expect(result[2].charPosition).toBe(8);
    });
  });

  describe('calculateChordPosition', () => {
    it('should return 1 for beginning of line', () => {
      expect(service.calculateChordPosition(0, 100)).toBe(1);
      expect(service.calculateChordPosition(10, 100)).toBe(1);
    });

    it('should return 3 for middle of line', () => {
      expect(service.calculateChordPosition(40, 100)).toBe(3);
      expect(service.calculateChordPosition(50, 100)).toBe(3);
    });

    it('should return 5 for end of line', () => {
      expect(service.calculateChordPosition(80, 100)).toBe(5);
      expect(service.calculateChordPosition(90, 100)).toBe(5);
    });

    it('should return 1 for zero length reference', () => {
      expect(service.calculateChordPosition(0, 0)).toBe(1);
    });
  });

  describe('parseChord', () => {
    it('should parse simple chord', () => {
      const result = service.parseChord('C');
      expect(result).not.toBeNull();
      expect(result?.rootNote).toBe('C');
      expect(result?.chordQuality).toBe('');
      expect(result?.slashChord).toBe('');
    });

    it('should parse chord with quality', () => {
      const result = service.parseChord('Cmaj7');
      expect(result).not.toBeNull();
      expect(result?.rootNote).toBe('C');
      expect(result?.chordQuality).toBe('maj7');
    });

    it('should parse slash chord', () => {
      const result = service.parseChord('C/G');
      expect(result).not.toBeNull();
      expect(result?.rootNote).toBe('C');
      expect(result?.slashChord).toBe('G');
    });

    it('should normalize flats in parsed chord', () => {
      const result = service.parseChord('Db');
      expect(result).not.toBeNull();
      expect(result?.rootNote).toBe('C#');
    });

    it('should return null for invalid chord', () => {
      expect(service.parseChord('X')).toBeNull();
      expect(service.parseChord('H7')).toBeNull();
      expect(service.parseChord('123')).toBeNull();
    });
  });

  describe('redistributePositions', () => {
    it('should return empty array for empty input', () => {
      const result = service.redistributePositions([]);
      expect(result).toEqual([]);
    });

    it('should handle single chord', () => {
      const input = [{ chord: 'C', charPosition: 0, calculatedPosition: 1 }];
      const result = service.redistributePositions(input);
      expect(result).toHaveLength(1);
      expect(result[0].finalPosition).toBe(1);
    });

    it('should resolve conflicts by moving chords forward', () => {
      const input = [
        { chord: 'C', charPosition: 0, calculatedPosition: 1 },
        { chord: 'D', charPosition: 5, calculatedPosition: 1 },
      ];
      const result = service.redistributePositions(input);
      expect(result[0].finalPosition).toBe(1);
      expect(result[1].finalPosition).not.toBe(1);
    });

    it('should maintain order of chords', () => {
      const input = [
        { chord: 'C', charPosition: 0, calculatedPosition: 1 },
        { chord: 'D', charPosition: 10, calculatedPosition: 2 },
        { chord: 'E', charPosition: 20, calculatedPosition: 3 },
      ];
      const result = service.redistributePositions(input);
      expect(result[0].chord).toBe('C');
      expect(result[1].chord).toBe('D');
      expect(result[2].chord).toBe('E');
    });
  });

  describe('optimizeDistribution', () => {
    it('should place single chord in center', () => {
      const input = [{ chord: 'C', charPosition: 0, calculatedPosition: 1 }];
      const result = service.optimizeDistribution(input);
      expect(result[0].finalPosition).toBe(3);
    });

    it('should distribute two chords in positions 2 and 4', () => {
      const input = [
        { chord: 'C', charPosition: 0, calculatedPosition: 1 },
        { chord: 'D', charPosition: 10, calculatedPosition: 2 },
      ];
      const result = service.optimizeDistribution(input);
      expect(result[0].finalPosition).toBe(2);
      expect(result[1].finalPosition).toBe(4);
    });

    it('should distribute three chords in positions 1, 3, 5', () => {
      const input = [
        { chord: 'C', charPosition: 0, calculatedPosition: 1 },
        { chord: 'D', charPosition: 10, calculatedPosition: 2 },
        { chord: 'E', charPosition: 20, calculatedPosition: 3 },
      ];
      const result = service.optimizeDistribution(input);
      expect(result[0].finalPosition).toBe(1);
      expect(result[1].finalPosition).toBe(3);
      expect(result[2].finalPosition).toBe(5);
    });

    it('should distribute five chords in all positions', () => {
      const input = [
        { chord: 'C', charPosition: 0, calculatedPosition: 1 },
        { chord: 'D', charPosition: 5, calculatedPosition: 2 },
        { chord: 'E', charPosition: 10, calculatedPosition: 3 },
        { chord: 'F', charPosition: 15, calculatedPosition: 4 },
        { chord: 'G', charPosition: 20, calculatedPosition: 5 },
      ];
      const result = service.optimizeDistribution(input);
      expect(result[0].finalPosition).toBe(1);
      expect(result[1].finalPosition).toBe(2);
      expect(result[2].finalPosition).toBe(3);
      expect(result[3].finalPosition).toBe(4);
      expect(result[4].finalPosition).toBe(5);
    });
  });

  describe('getRootNotes', () => {
    it('should return array of root notes', () => {
      const notes = service.getRootNotes();
      expect(notes).toBeInstanceOf(Array);
      expect(notes).toContain('C');
      expect(notes).toContain('G');
      expect(notes).toContain('A#');
    });
  });

  describe('getChordQualities', () => {
    it('should return array of chord qualities', () => {
      const qualities = service.getChordQualities();
      expect(qualities).toBeInstanceOf(Array);
      expect(qualities).toContain('maj7');
      expect(qualities).toContain('m7');
      expect(qualities).toContain('');
    });
  });
});
