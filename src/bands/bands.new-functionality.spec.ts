import { BandsService } from './bands.service';
import { CreateBandDto } from './dto/create-band.dto';

describe('BandsService - New Functionality', () => {
  let service: BandsService;
  let mockPrisma: any;
  let mockEventsGateway: any;
  let mockSubscriptionsService: any;

  beforeEach(() => {
    mockPrisma = {
      bands: {
        create: jest.fn(),
      },
    };

    mockEventsGateway = {
      server: {
        emit: jest.fn(),
      },
    };

    mockSubscriptionsService = {
      createTrialSubscription: jest.fn(),
      getSubscriptionByBandId: jest.fn(),
      checkPlanLimits: jest.fn(),
      cancelSubscription: jest.fn(),
    };

    service = new BandsService(mockPrisma, mockEventsGateway, mockSubscriptionsService);
  });

  describe('createBand with automatic membership', () => {
    it('should create band and add creator as admin member', async () => {
      const createBandDto: CreateBandDto = { name: 'Test Band' };
      const userId = 1;

      const expectedBand = {
        id: 1,
        name: 'Test Band',
        members: [
          {
            id: 1,
            userId: 1,
            bandId: 1,
            role: 'Líder/Admin',
            active: true,
            isAdmin: true,
            isEventManager: true,
            user: { id: 1, name: 'Test User', phone: '+1234567890' },
          },
        ],
      };

      mockPrisma.bands.create.mockResolvedValue(expectedBand);

      const result = await service.createBand(createBandDto, userId);

      expect(mockPrisma.bands.create).toHaveBeenCalledWith({
        data: {
          ...createBandDto,
          creator: {
            connect: { id: userId },
          },
          members: {
            create: {
              userId,
              role: 'Líder/Admin',
              active: true,
              isAdmin: true,
              isEventManager: true,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      expect(result).toEqual(expectedBand);
    });

    it('should handle createBand with userId parameter', async () => {
      const createBandDto: CreateBandDto = { name: 'Another Band' };
      const userId = 2;

      mockPrisma.bands.create.mockResolvedValue({
        id: 2,
        name: 'Another Band',
      });

      await service.createBand(createBandDto, userId);

      // Verify the method was called with both parameters
      expect(mockPrisma.bands.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Another Band',
            creator: expect.objectContaining({
              connect: expect.objectContaining({
                id: 2,
              }),
            }),
            members: expect.objectContaining({
              create: expect.objectContaining({
                userId: 2,
                isAdmin: true,
                isEventManager: true,
              }),
            }),
          }),
        }),
      );
    });
  });
});
