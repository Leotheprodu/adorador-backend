import { PartialType } from '@nestjs/swagger';
import { CreateSongsChordDto } from './create-songs-chord.dto';

export class UpdateSongsChordDto extends PartialType(CreateSongsChordDto) {}
