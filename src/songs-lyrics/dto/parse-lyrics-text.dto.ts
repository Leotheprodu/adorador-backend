import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ParseLyricsTextDto {
  @ApiProperty({
    description:
      'Text content with lyrics and chords in the same format as file upload',
    example: `[Verse]
C       G       Am      F
Amazing grace how sweet the sound
    G           C
That saved a wretch like me

[Chorus]
F       G       C
I once was lost but now am found
F       G           C
Was blind but now I see`,
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Text content cannot be empty' })
  textContent: string;
}
