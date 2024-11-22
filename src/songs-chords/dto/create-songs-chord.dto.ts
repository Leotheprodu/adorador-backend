import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
enum positionValues {
  position1 = 1,
  position2 = 2,
  position3 = 3,
  position4 = 4,
  position5 = 5,
}

enum rootNotes {
  C = 'C',
  Csharp = 'C#',
  D = 'D',
  Dsharp = 'D#',
  E = 'E',
  F = 'F',
  Fsharp = 'F#',
  G = 'G',
  Gsharp = 'G#',
  A = 'A',
  Asharp = 'A#',
  B = 'B',
}

enum chordQualities {
  major = '',
  minor = 'm',
  diminished = 'dim',
  augmented = 'aug',
  sus2 = 'sus2',
  sus4 = 'sus4',
  dominant7 = '7',
  major7 = 'maj7',
  minor7 = 'm7',
  minorMajor7 = 'mMaj7',
  diminished7 = 'dim7',
  halfDiminished7 = 'm7b5',
  dominant9 = '9',
  major9 = 'maj9',
  minor9 = 'm9',
  dominant11 = '11',
  major11 = 'maj11',
  minor11 = 'm11',
  dominant13 = '13',
  major13 = 'maj13',
  minor13 = 'm13',
}

export class CreateSongsChordDto {
  @IsEnum(rootNotes)
  @IsNotEmpty()
  rootNote: string;

  @IsEnum(chordQualities)
  @IsOptional()
  chordQuality: chordQualities;

  @IsEnum(rootNotes)
  @IsOptional()
  slashChord: rootNotes;

  @IsEnum(positionValues)
  @IsNotEmpty()
  position: positionValues;
}
