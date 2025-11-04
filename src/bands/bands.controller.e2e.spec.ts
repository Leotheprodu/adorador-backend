jest.mock('../auth/guards/permissions/permissions.guard');
jest.mock('../auth/decorators/permissions.decorators');
jest.mock('../auth/decorators/get-user.decorator');
jest.mock('../auth/services/jwt.service');
jest.mock('../chore/utils/catchHandle');
jest.mock('../../config/constants', () => ({
  userRoles: {
    admin: { id: 1 },
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { BandsController } from './bands.controller';
import { BandsService } from './bands.service';
import { PrismaService } from '../prisma.service';
import { PermissionsGuard } from '../auth/guards/permissions/permissions.guard';

// Mock de BD en memoria usando Map
class InMemoryPrismaService {
  private bandsData = new Map<number, any>();
  private nextId = 1;

  bands = {
    findMany: jest.fn(async (args?: any) => {
      let data = Array.from(this.bandsData.values());

      // Aplicar filtros básicos
      if (args?.where?.members?.some?.userId) {
        // Simular filtro por userId (simplificado)
        data = data.filter((band) =>
          band.members?.some(
            (m: any) => m.userId === args.where.members.some.userId,
          ),
        );
      }

      // Omitir campos si se especifica
      if (args?.omit) {
        data = data.map((band) => {
          const copy = { ...band };
          Object.keys(args.omit).forEach((key) => delete copy[key]);
          return copy;
        });
      }

      return data;
    }),

    findUnique: jest.fn(async (args: any) => {
      const band = this.bandsData.get(args.where.id);
      if (!band) return null;

      // Aplicar omit e include (simplificado)
      const copy = { ...band };
      if (args?.omit) {
        Object.keys(args.omit).forEach((key) => delete copy[key]);
      }
      if (args?.include) {
        copy._count = { events: 0, songs: 0 }; // Simulado
        copy.songs = [];
        copy.events = [];
      }
      return copy;
    }),

    create: jest.fn(async (args: any) => {
      const newBand = {
        ...args.data,
        id: this.nextId++,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.bandsData.set(newBand.id, newBand);
      return newBand;
    }),

    update: jest.fn(async (args: any) => {
      const existing = this.bandsData.get(args.where.id);
      if (!existing) throw new Error('Band not found');
      const updated = { ...existing, ...args.data, updatedAt: new Date() };
      this.bandsData.set(args.where.id, updated);
      return updated;
    }),

    delete: jest.fn(async (args: any) => {
      const band = this.bandsData.get(args.where.id);
      if (!band) throw new Error('Band not found');
      this.bandsData.delete(args.where.id);
      return band;
    }),
  };
}

describe('BandsController (e2e) - In Memory DB', () => {
  let app: INestApplication;
  let inMemoryPrisma: InMemoryPrismaService;

  beforeEach(async () => {
    inMemoryPrisma = new InMemoryPrismaService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BandsController],
      providers: [BandsService],
    })
      .overrideProvider(PrismaService)
      .useValue(inMemoryPrisma)
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: jest.fn(() => true) }) // Siempre permite
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/bands (GET) - should return empty array initially', () => {
    return request(app.getHttpServer()).get('/bands').expect(200).expect([]);
  });

  it('/bands (POST) - should create a band', () => {
    const newBand = { name: 'Test Band' };

    return request(app.getHttpServer())
      .post('/bands')
      .send(newBand)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('Test Band');
      });
  });

  it('/bands (GET) - should return created bands', async () => {
    // Crear una banda primero
    await request(app.getHttpServer())
      .post('/bands')
      .send({ name: 'Test Band' });

    return request(app.getHttpServer())
      .get('/bands')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBe(1);
        expect(res.body[0].name).toBe('Test Band');
      });
  });

  it('/bands/:id (GET) - should return a specific band', async () => {
    // Crear una banda
    const createRes = await request(app.getHttpServer())
      .post('/bands')
      .send({ name: 'Specific Band' });

    const bandId = createRes.body.id;

    return request(app.getHttpServer())
      .get(`/bands/${bandId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(bandId);
        expect(res.body.name).toBe('Specific Band');
      });
  });

  it('/bands/:id (PATCH) - should update a band', async () => {
    // Crear una banda
    const createRes = await request(app.getHttpServer())
      .post('/bands')
      .send({ name: 'Original Band' });

    const bandId = createRes.body.id;

    return request(app.getHttpServer())
      .patch(`/bands/${bandId}`)
      .send({ name: 'Updated Band' })
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(bandId);
        expect(res.body.name).toBe('Updated Band');
      });
  });

  it('/bands/:id (DELETE) - should delete a band', async () => {
    // Crear una banda
    const createRes = await request(app.getHttpServer())
      .post('/bands')
      .send({ name: 'Band to Delete' });

    const bandId = createRes.body.id;

    // Eliminar
    await request(app.getHttpServer()).delete(`/bands/${bandId}`).expect(200);

    // Verificar que ya no existe
    return request(app.getHttpServer()).get(`/bands/${bandId}`).expect(404);
  });
});
