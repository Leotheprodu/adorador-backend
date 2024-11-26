import { Injectable } from '@nestjs/common';
import { CreateSongsLyricDto } from './dto/create-songs-lyric.dto';
import { UpdateSongsLyricDto } from './dto/update-songs-lyric.dto';
import { PrismaService } from 'src/prisma.service';

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
      console.log(' Deleting chords for lyric', id);
      await this.prisma.songs_Chords.deleteMany({
        where: { lyricId: id },
      });
    }
    return await this.prisma.songs_lyrics.delete({
      where: { id, songId },
    });
  }

  async parseAndSaveLyricsWithChords(fileBuffer: Buffer, songId: number) {
    const fileContent = Buffer.from(fileBuffer).toString('utf-8');
    const lines = fileContent.split('\n');

    let position = 1;

    for (let i = 0; i < lines.length; i += 2) {
      const chordsLine = lines[i].trim();
      const lyricsLine = lines[i + 1]?.trim() || '';

      if (lyricsLine === '') continue; // Ignorar líneas vacías

      const chords = chordsLine.match(
        /[A-G][#b]?(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?(\/[A-G][#b]?(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?)?/g,
      );

      const lyric = await this.prisma.songs_lyrics.create({
        data: {
          songId,
          lyrics: lyricsLine,
          position,
          structureId: 2,
        },
      });

      if (chords) {
        chords.forEach(async (chord, index) => {
          const match = chord.match(
            /^([A-G][#b]?)(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?(\/([A-G][#b]?)(maj7|mMaj7|dim7|m7b5|maj9|maj11|maj13|sus4|sus2|aug|dim|m13|m11|m9|m7|7|9|11|13|m)?)?$/,
          );

          if (match) {
            const [_, rootNote, chordQuality, __, slashRoot] = match;

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
                  position: index + 1,
                },
              });
            }
          }
        });
      }

      position++;
    }

    return {
      message:
        'Lyrics and chords processed with validated notes and qualities!',
    };
  }
}
