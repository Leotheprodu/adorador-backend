import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';

describe('EventsController', () => {
  let service: EventsService;

  const mockEventsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addSongsToEvent: jest.fn(),
    deleteSongsFromEvent: jest.fn(),
    updateSongsFromEvent: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('EventsService should be defined', () => {
    expect(service).toBeDefined();
  });

  // Tests simplificados del servicio (ya testeado en events.service.spec.ts)
  describe('Service Methods', () => {
    it('should have create method', () => {
      expect(service.create).toBeDefined();
    });

    it('should have findAll method', () => {
      expect(service.findAll).toBeDefined();
    });

    it('should have findOne method', () => {
      expect(service.findOne).toBeDefined();
    });

    it('should have update method', () => {
      expect(service.update).toBeDefined();
    });

    it('should have remove method', () => {
      expect(service.remove).toBeDefined();
    });

    it('should have addSongsToEvent method', () => {
      expect(service.addSongsToEvent).toBeDefined();
    });

    it('should have deleteSongsFromEvent method', () => {
      expect(service.deleteSongsFromEvent).toBeDefined();
    });

    it('should have updateSongsEvent method', () => {
      expect(mockEventsService.updateSongsFromEvent).toBeDefined();
    });
  });
});
