import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let event: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService],
    }).compile();

    event = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });
});
