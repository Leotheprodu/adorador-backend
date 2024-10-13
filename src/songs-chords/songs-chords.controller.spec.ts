import { Test, TestingModule } from '@nestjs/testing';
import { SongsChordsController } from './songs-chords.controller';
import { SongsChordsService } from './songs-chords.service';

describe('SongsChordsController', () => {
  let controller: SongsChordsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongsChordsController],
      providers: [SongsChordsService],
    }).compile();

    controller = module.get<SongsChordsController>(SongsChordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
