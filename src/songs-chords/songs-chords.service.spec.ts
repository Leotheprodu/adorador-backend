import { Test, TestingModule } from '@nestjs/testing';
import { SongsChordsService } from './songs-chords.service';

describe('SongsChordsService', () => {
  let service: SongsChordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SongsChordsService],
    }).compile();

    service = module.get<SongsChordsService>(SongsChordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
