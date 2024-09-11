import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    await this.initializeRoles();
    await this.initializeChurchRoles();
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
          // Add more roles as needed
        ],
      });
      console.log('Initial roles created.');
    }
  }
  async initializeChurchRoles() {
    const existingChurchRoles = await this.churchRoles.findMany();

    if (existingChurchRoles.length === 0) {
      await this.churchRoles.createMany({
        data: [
          { name: 'Pastor', description: 'Encargado principal de la iglesia' },
          {
            name: 'Líder de Alabanza',
            description: 'Encargado de la música y adoración',
          },
          { name: 'Músico', description: 'Parte del equipo de alabanza' },
          {
            name: 'Líder de Jóvenes',
            description: 'Dirige el ministerio juvenil',
          },
          {
            name: 'Diácono',
            description: 'Apoya en el servicio práctico de la iglesia',
          },
          {
            name: 'Maestro',
            description: 'Enseña a niños o adultos en la iglesia',
          },
          {
            name: 'Evangelista',
            description: 'Predica el evangelio y hace trabajo misionero',
          },
          {
            name: 'Intercesor',
            description: 'Encargado de la oración e intercesión',
          },
          {
            name: 'Consejero',
            description: 'Ayuda a personas con problemas y necesidades',
          },
          {
            name: 'Tesorero',
            description: 'Maneja las finanzas y recursos de la iglesia',
          },
          {
            name: 'Consejo de Ancianos',
            description: 'Grupo de líderes espirituales de la iglesia',
          },
          {
            name: 'Danza y teatro',
            description: 'Encargado de la danza y teatro en la iglesia',
          },
          // Añade más roles según las necesidades de la iglesia
        ],
      });
      console.log('Initial church roles created.');
    }
  }
}
