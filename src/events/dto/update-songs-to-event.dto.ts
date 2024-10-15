import { PartialType } from '@nestjs/swagger';
import { AddSongsToEventDto } from './add-songs-to-event.dto';

export class UpdateSongsEventDto extends PartialType(AddSongsToEventDto) {}
