import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    await this.initializeRoles();
  }

  async initializeRoles() {
    const existingRoles = await this.roles.findMany();

    if (existingRoles.length === 0) {
      await this.roles.createMany({
        data: [
          { name: 'admin' },
          { name: 'user' },
          { name: 'moderator' },
          { name: 'editor' },
          { name: 'musician' },
          // Add more roles as needed
        ],
      });
      console.log('Initial roles created.');
    }
  }
}
