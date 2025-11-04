import { Injectable } from '@nestjs/common';
import { CreateSongsLyricDto } from './dto/create-songs-lyric.dto';
import { UpdateSongsLyricDto } from './dto/update-songs-lyric.dto';
import { PrismaService } from '../prisma.service';
import { LyricsNormalizerService } from './services/lyrics-normalizer.service';
import { ChordProcessorService } from './services/chord-processor.service';
import { LyricsParserService } from './services/lyrics-parser.service';

@Injectable()
export class SongsLyricsService {
  constructor(
    private prisma: PrismaService,
    private lyricsNormalizer: LyricsNormalizerService,
    private chordProcessor: ChordProcessorService,
    private lyricsParser: LyricsParserService,
  ) {}

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

  async parseAndSaveLyricsWithChords(fileBuffer: Buffer, songId: number) {
    const fileContent = fileBuffer.toString('utf-8');

    // Parsear contenido del archivo
    const { cleanedLines: lines, lineMapping: lineToOriginalMap } =
      this.lyricsParser.parseFileContent(fileContent);

    // Validar que no haya más de 5 acordes por línea
    const validation = this.lyricsParser.validateMaxChordsPerLine(lines);
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
      const structureId = this.lyricsParser.detectStructure(line);
      if (structureId !== null) {
        currentStructureId = structureId;
        continue; // Saltar al siguiente ciclo
      }

      // Verificar si la línea actual tiene acordes
      const currentLineHasChords = this.lyricsParser.hasChords(line);
      const nextLine = lines[i + 1];
      const nextLineIsStructure = nextLine
        ? this.lyricsParser.detectStructure(nextLine) !== null
        : false;

      // CASO 1: Solo letra (sin acordes)
      if (!currentLineHasChords) {
        // Si la siguiente línea es una estructura, ignorar esta línea
        if (nextLineIsStructure) {
          continue;
        }

        // Es una línea de letra sin acordes - normalizar antes de guardar
        const normalizedLyrics = this.lyricsNormalizer.normalize(line);

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
      const nextLineHasChords = this.lyricsParser.hasChords(lyricsLine);
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
        this.chordProcessor.extractChordsWithPosition(originalChordsLine);

      // Normalizar la letra antes de guardar
      const normalizedLyrics = this.lyricsNormalizer.normalize(lyricsLine);

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
            calculatedPosition: this.chordProcessor.calculateChordPosition(
              charPosition,
              referenceLength,
            ),
          }),
        );

        // Redistribuir posiciones para evitar duplicados
        const chordsWithFinalPositions =
          this.chordProcessor.redistributePositions(
            chordsWithCalculatedPositions,
          );

        // Guardar los acordes con sus posiciones finales
        for (const {
          chord,
          charPosition,
          finalPosition,
        } of chordsWithFinalPositions) {
          const parsedChord = this.chordProcessor.parseChord(chord);

          if (parsedChord) {
            await this.prisma.songs_Chords.create({
              data: {
                lyricId: lyric.id,
                rootNote: parsedChord.rootNote,
                chordQuality: parsedChord.chordQuality,
                slashChord: parsedChord.slashChord,
                position: finalPosition,
              },
            });
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
