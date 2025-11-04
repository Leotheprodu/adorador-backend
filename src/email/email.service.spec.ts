import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma.service';
import { MailerService } from '@nestjs-modules/mailer';
import { TemporalTokenPoolService } from '../temporal-token-pool/temporal-token-pool.service';

describe('EmailService', () => {
  let service: EmailService;

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockPrismaService = {
    users: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockTemporalTokenPoolService = {
    createToken: jest.fn(),
    validateToken: jest.fn(),
    deleteToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TemporalTokenPoolService,
          useValue: mockTemporalTokenPoolService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
