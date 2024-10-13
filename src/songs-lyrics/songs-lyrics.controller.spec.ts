import { Test, TestingModule } from '@nestjs/testing';
import { SongsLyricsController } from './songs-lyrics.controller';
import { SongsLyricsService } from './songs-lyrics.service';

describe('SongsLyricsController', () => {
  let controller: SongsLyricsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongsLyricsController],
      providers: [SongsLyricsService],
    }).compile();

    controller = module.get<SongsLyricsController>(SongsLyricsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
