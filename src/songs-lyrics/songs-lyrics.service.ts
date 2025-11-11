import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateSongsLyricDto } from './dto/create-songs-lyric.dto';
import { UpdateSongsLyricDto } from './dto/update-songs-lyric.dto';
import { PrismaService } from '../prisma.service';
import { LyricsNormalizerService } from './services/lyrics-normalizer.service';
import { ChordProcessorService } from './services/chord-processor.service';
import { LyricsParserService } from './services/lyrics-parser.service';
import { EventsGateway } from '../events/events.gateway';
import { compressMessage } from '../events/interfaces/websocket-messages.interface';

@Injectable()
export class SongsLyricsService {
  private readonly logger = new Logger(SongsLyricsService.name);

  constructor(
    private prisma: PrismaService,
    private lyricsNormalizer: LyricsNormalizerService,
    private chordProcessor: ChordProcessorService,
    private lyricsParser: LyricsParserService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(data: CreateSongsLyricDto, songId: number) {
    const result = await this.prisma.songs_lyrics.create({
      data: { ...data, songId },
    });

    // Notificar a todos los eventos que contienen esta canción
    await this.notifySongUpdate(songId, 'lyrics');

    return result;
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

  /**
   * Notifica a todos los eventos que contienen una canción que fue actualizada
   */
  private async notifySongUpdate(
    songId: number,
    changeType: 'lyrics' | 'info' | 'all' = 'lyrics',
  ) {
    try {
      // Encontrar todos los eventos que contienen esta canción
      const eventsWithSong = await this.prisma.songsEvents.findMany({
        where: { songId },
        include: {
          event: true,
        },
      });

      if (eventsWithSong.length > 0) {
        this.logger.log(
          `Canción ${songId} actualizada. Notificando a ${eventsWithSong.length} eventos (tipo: ${changeType})`,
        );

        // Emitir evento WebSocket a cada evento afectado
        for (const eventSong of eventsWithSong) {
          const eventId = eventSong.event.id;

          try {
            // Formato comprimido
            const message = compressMessage(
              eventId.toString(),
              {
                sid: songId,
                ct: changeType,
              },
              'system',
            );

            // Emitir a todos los clientes conectados a este evento
            this.eventsGateway.server.emit(`songUpdated-${eventId}`, message);

            this.logger.log(
              `✅ Emitido songUpdated-${eventId} para canción ${songId} (tipo: ${changeType})`,
            );
          } catch (error) {
            this.logger.error(
              `❌ Error emitiendo WebSocket para evento ${eventId}: ${error.message}`,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Error notificando actualización de canción ${songId}: ${error.message}`,
      );
    }
  }

  async update(
    id: number,
    songId: number,
    updateSongsLyricDto: UpdateSongsLyricDto,
  ) {
    const result = await this.prisma.songs_lyrics.update({
      where: { id, songId },
      data: updateSongsLyricDto,
    });

    // Notificar a todos los eventos que contienen esta canción
    await this.notifySongUpdate(songId, 'lyrics');

    return result;
  }

  async updateArrayOfLyrics(songId: number, lyrics: UpdateSongsLyricDto[]) {
    const updatePromises = lyrics.map((lyric) =>
      this.prisma.songs_lyrics.update({
        where: { id: lyric.id, songId },
        data: { position: lyric.position },
      }),
    );
    const result = await Promise.all(updatePromises);

    // Notificar a todos los eventos que contienen esta canción
    await this.notifySongUpdate(songId, 'lyrics');

    return result;
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
    const result = await this.prisma.songs_lyrics.delete({
      where: { id, songId },
    });

    // Notificar a todos los eventos que contienen esta canción
    await this.notifySongUpdate(songId, 'lyrics');

    return result;
  }

  async removeAllLyrics(songId: number) {
    // Primero obtener todos los IDs de lyrics de la canción
    const lyrics = await this.prisma.songs_lyrics.findMany({
      where: { songId },
      select: { id: true },
    });

    const lyricIds = lyrics.map((lyric) => lyric.id);

    // Eliminar todos los acordes relacionados con estas letras
    if (lyricIds.length > 0) {
      await this.prisma.songs_Chords.deleteMany({
        where: {
          lyricId: {
            in: lyricIds,
          },
        },
      });

      // Eliminar todas las letras de la canción
      await this.prisma.songs_lyrics.deleteMany({
        where: { songId },
      });

      // Notificar a todos los eventos que contienen esta canción
      await this.notifySongUpdate(songId, 'lyrics');
    }

    return {
      deletedLyrics: lyricIds.length,
      message: `Deleted ${lyricIds.length} lyrics and their associated chords`,
    };
  }

  async parseAndSaveLyricsWithChords(fileBuffer: Buffer, songId: number) {
    const fileContent = fileBuffer.toString('utf-8');
    return await this.parseAndSaveLyricsFromText(fileContent, songId);
  }

  async parseAndSaveLyricsFromText(textContent: string, songId: number) {
    // Parsear contenido del texto
    const { cleanedLines: lines, lineMapping: lineToOriginalMap } =
      this.lyricsParser.parseFileContent(textContent);

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

    // Notificar a todos los eventos que contienen esta canción
    await this.notifySongUpdate(songId, 'lyrics');

    return {
      message:
        'Lyrics and chords processed with validated notes and qualities!',
    };
  }

  /**
   * Normaliza las letras existentes aplicando las mismas reglas
   * que se usan al cargar desde archivo txt
   */
  async normalizeLyrics(songId: number, lyricIds: number[]) {
    const results = {
      success: [] as number[],
      failed: [] as { id: number; error: string }[],
      notFound: [] as number[],
    };

    for (const lyricId of lyricIds) {
      try {
        // Buscar la letra
        const lyric = await this.prisma.songs_lyrics.findUnique({
          where: { id: lyricId, songId },
        });

        if (!lyric) {
          results.notFound.push(lyricId);
          continue;
        }

        // Normalizar la letra
        const normalizedLyrics = this.lyricsNormalizer.normalize(lyric.lyrics);

        // Actualizar en la base de datos
        await this.prisma.songs_lyrics.update({
          where: { id: lyricId, songId },
          data: { lyrics: normalizedLyrics },
        });

        results.success.push(lyricId);
      } catch (error) {
        results.failed.push({
          id: lyricId,
          error: error.message || 'Unknown error',
        });
      }
    }

    // Notificar a todos los eventos que contienen esta canción si hubo actualizaciones exitosas
    if (results.success.length > 0) {
      await this.notifySongUpdate(songId, 'lyrics');
    }

    return {
      message: `Normalized ${results.success.length} of ${lyricIds.length} lyrics`,
      results,
    };
  }

  /**
   * Parsea y actualiza una sola línea de letra con acordes
   * Mantiene el ID de la letra pero reemplaza acordes y texto
   */
  async parseAndUpdateSingleLyric(
    lyricId: number,
    songId: number,
    textContent: string,
  ) {
    // Verificar que la letra existe y pertenece a la canción
    const existingLyric = await this.prisma.songs_lyrics.findUnique({
      where: { id: lyricId, songId },
      include: { chords: true },
    });

    if (!existingLyric) {
      throw new HttpException(
        `Lyric ${lyricId} not found for song ${songId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Parsear contenido del texto
    const { cleanedLines: lines, lineMapping: lineToOriginalMap } =
      this.lyricsParser.parseFileContent(textContent);

    // Validar que no haya más de 5 acordes
    const validation = this.lyricsParser.validateMaxChordsPerLine(lines);
    if (!validation.valid) {
      throw new HttpException(
        `Validation failed:\n${validation.errors.join('\n')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Filtrar líneas vacías y de estructura
    const validLines = lines.filter((line) => {
      const structureId = this.lyricsParser.detectStructure(line);
      return structureId === null && line.trim().length > 0;
    });

    if (validLines.length === 0) {
      throw new Error('No valid lyrics found in the text content');
    }

    // Procesar las líneas para encontrar acordes y letra
    let chordsLine: string | null = null;
    let lyricsLine: string | null = null;
    let originalChordsLine: string | null = null;
    let originalLyricsLine: string | null = null;

    for (let i = 0; i < validLines.length; i++) {
      const line = validLines[i];
      const hasChords = this.lyricsParser.hasChords(line);

      if (hasChords && !chordsLine) {
        chordsLine = line;
        originalChordsLine = lineToOriginalMap.get(lines.indexOf(line)) || line;

        // Verificar si hay una siguiente línea que sea letra
        const nextLine = validLines[i + 1];
        if (nextLine && !this.lyricsParser.hasChords(nextLine)) {
          lyricsLine = nextLine;
          originalLyricsLine =
            lineToOriginalMap.get(lines.indexOf(nextLine)) || nextLine;
          break;
        }
      } else if (!hasChords && !lyricsLine) {
        // Primera línea sin acordes es la letra
        lyricsLine = line;
        originalLyricsLine = lineToOriginalMap.get(lines.indexOf(line)) || line;
        break;
      }
    }

    // Si no encontramos letra, usar la primera línea válida
    if (!lyricsLine && validLines.length > 0) {
      const firstValidLine = validLines[0];
      lyricsLine = firstValidLine;
      originalLyricsLine =
        lineToOriginalMap.get(lines.indexOf(firstValidLine)) || firstValidLine;
    }

    if (!lyricsLine) {
      throw new Error('No lyrics text found');
    }

    // Normalizar la letra
    const normalizedLyrics = this.lyricsNormalizer.normalize(lyricsLine);

    // Eliminar todos los acordes existentes de esta letra
    await this.prisma.songs_Chords.deleteMany({
      where: { lyricId },
    });

    // Actualizar el texto de la letra
    const updatedLyric = await this.prisma.songs_lyrics.update({
      where: { id: lyricId, songId },
      data: { lyrics: normalizedLyrics },
    });

    // Si hay acordes, procesarlos y crear nuevos
    if (chordsLine && originalChordsLine) {
      const chordsWithPosition =
        this.chordProcessor.extractChordsWithPosition(originalChordsLine);

      if (chordsWithPosition.length > 0) {
        const referenceLength = Math.max(
          originalChordsLine.length,
          originalLyricsLine?.length || 0,
        );

        // Calcular posiciones
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

        // Redistribuir posiciones
        const chordsWithFinalPositions =
          this.chordProcessor.redistributePositions(
            chordsWithCalculatedPositions,
          );

        // Crear los nuevos acordes
        for (const { chord, finalPosition } of chordsWithFinalPositions) {
          const parsedChord = this.chordProcessor.parseChord(chord);

          if (parsedChord) {
            await this.prisma.songs_Chords.create({
              data: {
                lyricId: updatedLyric.id,
                rootNote: parsedChord.rootNote,
                chordQuality: parsedChord.chordQuality,
                slashChord: parsedChord.slashChord,
                position: finalPosition,
              },
            });
          }
        }
      }
    }

    // Notificar a todos los eventos que contienen esta canción
    await this.notifySongUpdate(songId, 'lyrics');

    // Retornar la letra actualizada con sus acordes
    return await this.prisma.songs_lyrics.findUnique({
      where: { id: lyricId },
      include: {
        chords: true,
        structure: true,
      },
    });
  }
}
