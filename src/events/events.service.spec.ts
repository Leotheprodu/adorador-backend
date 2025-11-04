import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from './events.gateway';

describe('EventsService', () => {
  let service: EventsService;
  let prismaService: any;

  const mockEvent = {
    id: 1,
    title: 'Test Event',
    date: new Date('2025-12-31'),
    bandId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    songs: [],
    _count: {
      songs: 0,
    },
  };

  const mockPrismaService = {
    events: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    songsEvents: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockEventsGateway = {
    emitEventUpdate: jest.fn(),
    emitEventCreated: jest.fn(),
    emitEventDeleted: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an event', async () => {
      const createEventDto = {
        title: 'Test Event',
        date: new Date('2025-12-31'),
      };
      const bandId = 1;

      prismaService.events.create.mockResolvedValue(mockEvent);

      const result = await service.create(createEventDto, bandId);

      expect(result).toEqual(mockEvent);
      expect(prismaService.events.create).toHaveBeenCalledWith({
        data: { ...createEventDto, bandId },
      });
    });
  });

  describe('findAll', () => {
    it('should return all events for a band', async () => {
      const bandId = 1;
      const mockEvents = [mockEvent];

      prismaService.events.findMany.mockResolvedValue(mockEvents);

      const result = await service.findAll(bandId);

      expect(result).toEqual(mockEvents);
      expect(prismaService.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { bandId },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an event by id and bandId', async () => {
      const eventId = 1;
      const bandId = 1;

      prismaService.events.findUnique.mockResolvedValue(mockEvent);

      const result = await service.findOne(eventId, bandId);

      expect(result).toEqual(mockEvent);
      expect(prismaService.events.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: eventId, bandId },
        }),
      );
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const eventId = 1;
      const bandId = 1;
      const updateEventDto = {
        title: 'Updated Event',
      };

      const updatedEvent = { ...mockEvent, title: 'Updated Event' };
      prismaService.events.update.mockResolvedValue(updatedEvent);

      const result = await service.update(eventId, updateEventDto, bandId);

      expect(result).toEqual(updatedEvent);
      expect(prismaService.events.update).toHaveBeenCalledWith({
        where: { id: eventId, bandId },
        data: updateEventDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete an event', async () => {
      const eventId = 1;
      const bandId = 1;

      prismaService.events.delete.mockResolvedValue(mockEvent);

      const result = await service.remove(eventId, bandId);

      expect(result).toEqual(mockEvent);
      expect(prismaService.events.delete).toHaveBeenCalledWith({
        where: { id: eventId, bandId },
      });
    });
  });

  describe('addSongsToEvent', () => {
    it('should add songs to an event', async () => {
      const eventId = 1;
      const addSongsToEventDto = {
        songDetails: [
          { songId: 1, order: 1, transpose: 0 },
          { songId: 2, order: 2, transpose: 2 },
        ],
      };

      prismaService.songsEvents.createMany.mockResolvedValue({ count: 2 });

      const result = await service.addSongsToEvent(eventId, addSongsToEventDto);

      expect(result).toEqual({ count: 2 });
      expect(prismaService.songsEvents.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              eventId,
              songId: 1,
              order: 1,
              transpose: 0,
            }),
            expect.objectContaining({
              eventId,
              songId: 2,
              order: 2,
              transpose: 2,
            }),
          ]),
        }),
      );
    });
  });
});
