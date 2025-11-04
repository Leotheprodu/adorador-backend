import { Test, TestingModule } from '@nestjs/testing';
import { LyricsParserService } from './lyrics-parser.service';
import { ChordProcessorService } from './chord-processor.service';

describe('LyricsParserService', () => {
  let service: LyricsParserService;
  let chordProcessor: ChordProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LyricsParserService, ChordProcessorService],
    }).compile();

    service = module.get<LyricsParserService>(LyricsParserService);
    chordProcessor = module.get<ChordProcessorService>(ChordProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectStructure', () => {
    it('should detect verse structure in English', () => {
      expect(service.detectStructure('(verse)')).toBe(2);
      expect(service.detectStructure('(Verse)')).toBe(2);
      expect(service.detectStructure('(VERSE)')).toBe(2);
    });

    it('should detect verse structure in Spanish', () => {
      expect(service.detectStructure('(verso)')).toBe(2);
      expect(service.detectStructure('(Verso)')).toBe(2);
    });

    it('should detect chorus structure', () => {
      expect(service.detectStructure('(chorus)')).toBe(4);
      expect(service.detectStructure('(coro)')).toBe(4);
      expect(service.detectStructure('(estribillo)')).toBe(4);
    });

    it('should detect intro structure', () => {
      expect(service.detectStructure('(intro)')).toBe(1);
      expect(service.detectStructure('(introduction)')).toBe(1);
      expect(service.detectStructure('(introduccion)')).toBe(1);
    });

    it('should detect bridge structure', () => {
      expect(service.detectStructure('(bridge)')).toBe(5);
      expect(service.detectStructure('(puente)')).toBe(5);
    });

    it('should ignore numbers in structure', () => {
      expect(service.detectStructure('(verse 1)')).toBe(2);
      expect(service.detectStructure('(verse1)')).toBe(2);
      expect(service.detectStructure('(coro 2)')).toBe(4);
    });

    it('should return null for non-structure lines', () => {
      expect(service.detectStructure('This is a lyric')).toBeNull();
      expect(service.detectStructure('C D E')).toBeNull();
      expect(service.detectStructure('verse')).toBeNull(); // Missing parentheses
    });

    it('should handle accents', () => {
      expect(service.detectStructure('(introducción)')).toBe(1);
    });
  });

  describe('hasChords', () => {
    it('should detect simple chord lines', () => {
      expect(service.hasChords('C D E F')).toBe(true);
      expect(service.hasChords('G Am Dm')).toBe(true);
    });

    it('should detect chords with qualities', () => {
      expect(service.hasChords('Cmaj7 Dm7 G7')).toBe(true);
      expect(service.hasChords('Am7 F#m Bm')).toBe(true);
    });

    it('should not detect lyrics as chords', () => {
      expect(service.hasChords('De tu amor nunca me cansare')).toBe(false);
      expect(service.hasChords('Te alabo señor con todo mi corazon')).toBe(
        false,
      );
    });

    it('should handle mixed lines correctly', () => {
      // Line with mostly chords
      expect(service.hasChords('C G Am')).toBe(true);

      // Line with mostly text
      expect(service.hasChords('Aleluya aleluya aleluya gloria a dios')).toBe(
        false,
      );
    });

    it('should handle lines with dashes and spaces', () => {
      expect(service.hasChords('C - D - E')).toBe(true);
      expect(service.hasChords('C -D- E')).toBe(true);
    });
  });

  describe('validateMaxChordsPerLine', () => {
    it('should pass validation for lines with 5 or fewer chords', () => {
      const lines = ['C D E F G', 'Am Dm Em', 'Te alabo señor'];
      const result = service.validateMaxChordsPerLine(lines, 5);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for lines with more than 5 chords', () => {
      const lines = ['C D E F G A B']; // 7 chords
      const result = service.validateMaxChordsPerLine(lines, 5);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should ignore structure lines in validation', () => {
      const lines = ['(verse)', 'C D E F G'];
      const result = service.validateMaxChordsPerLine(lines, 5);
      expect(result.valid).toBe(true);
    });

    it('should ignore lyric lines in validation', () => {
      const lines = ['Te alabo señor', 'C D E'];
      const result = service.validateMaxChordsPerLine(lines, 5);
      expect(result.valid).toBe(true);
    });

    it('should use custom max chords parameter', () => {
      const lines = ['C D E F']; // 4 chords
      const result1 = service.validateMaxChordsPerLine(lines, 3);
      expect(result1.valid).toBe(false);

      const result2 = service.validateMaxChordsPerLine(lines, 5);
      expect(result2.valid).toBe(true);
    });
  });

  describe('parseFileContent', () => {
    it('should remove empty lines', () => {
      const content = 'Line 1\n\nLine 2\n\n\nLine 3';
      const { cleanedLines } = service.parseFileContent(content);
      expect(cleanedLines).toHaveLength(3);
      expect(cleanedLines).toEqual(['Line 1', 'Line 2', 'Line 3']);
    });

    it('should trim lines', () => {
      const content = '  Line 1  \n  Line 2  ';
      const { cleanedLines } = service.parseFileContent(content);
      expect(cleanedLines[0]).toBe('Line 1');
      expect(cleanedLines[1]).toBe('Line 2');
    });

    it('should handle different line endings', () => {
      const content1 = 'Line 1\nLine 2';
      const content2 = 'Line 1\r\nLine 2';

      const result1 = service.parseFileContent(content1);
      const result2 = service.parseFileContent(content2);

      expect(result1.cleanedLines).toEqual(result2.cleanedLines);
    });

    it('should create line mapping', () => {
      const content = 'Line 1\n\nLine 2\nLine 3';
      const { lineMapping } = service.parseFileContent(content);

      expect(lineMapping.get(0)).toBe('Line 1');
      expect(lineMapping.get(1)).toBe('Line 2');
      expect(lineMapping.get(2)).toBe('Line 3');
    });

    it('should preserve original spacing in mapping', () => {
      const content = '  C   D   E  \nLyrics here';
      const { lineMapping } = service.parseFileContent(content);

      const originalLine = lineMapping.get(0);
      expect(originalLine).toBe('  C   D   E  ');
      expect(originalLine?.startsWith(' ')).toBe(true);
    });
  });

  describe('getStructureMap', () => {
    it('should return structure map', () => {
      const structureMap = service.getStructureMap();
      expect(structureMap).toBeDefined();
      expect(structureMap['verse']).toBe(2);
      expect(structureMap['chorus']).toBe(4);
      expect(structureMap['intro']).toBe(1);
    });

    it('should return a copy of the structure map', () => {
      const map1 = service.getStructureMap();
      const map2 = service.getStructureMap();
      expect(map1).not.toBe(map2);
      expect(map1).toEqual(map2);
    });
  });
});
