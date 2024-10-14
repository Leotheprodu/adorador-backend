import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
enum positionValues {
  position1 = 0,
  position2 = 1,
  position3 = 2,
  position4 = 3,
  position5 = 4,
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

  @IsEnum(chordQualities)
  @IsOptional()
  slashQuality: chordQualities;

  @IsEnum(positionValues)
  @IsNotEmpty()
  position: positionValues;
}
