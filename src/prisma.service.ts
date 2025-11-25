import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    await this.initializeRoles();
    await this.initializeChurchRoles();
    await this.initializeSongsStructures();
    /* await this.initializeSubscriptionPlans(); */
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
          {
            name: 'Encargado de eventos web',
            description:
              'Encargado de el streaming de eventos en la aplicación',
          },
          // Añade más roles según las necesidades de la iglesia
        ],
      });
      console.log('Initial church roles created.');
    }
  }

  async initializeSongsStructures() {
    const existingStructures = await this.songs_Structures.findMany();

    if (existingStructures.length === 0) {
      await this.songs_Structures.createMany({
        data: [
          {
            title: 'intro',
          },
          {
            title: 'verse',
          },
          {
            title: 'pre-chorus',
          },
          {
            title: 'chorus',
          },
          {
            title: 'bridge',
          },
          {
            title: 'interlude',
          },
          {
            title: 'solo',
          },
          {
            title: 'outro',
          },
        ],
      });
      console.log('Initial song structures created.');
    }
  }

  /* async initializeSubscriptionPlans() {
    const existingPlans = await this.subscriptionPlans.findMany();

    if (existingPlans.length === 0) {
      await this.subscriptionPlans.createMany({
        data: [
          {
            name: 'Trial',
            type: 'TRIAL',
            price: 0,
            currency: 'USD',
            maxMembers: 5,
            maxSongs: 100,
            maxEventsPerMonth: 2,
            maxPeoplePerEvent: 5,
            durationDays: 15, // 15 días para nuevas bandas
            active: true,
          },
          {
            name: 'Básico',
            type: 'BASIC',
            price: 10,
            currency: 'USD',
            maxMembers: 5,
            maxSongs: 100,
            maxEventsPerMonth: 2,
            maxPeoplePerEvent: 5,
            durationDays: null, // Mensual
            active: true,
          },
          {
            name: 'Professional',
            type: 'PROFESSIONAL',
            price: 25,
            currency: 'USD',
            maxMembers: 15,
            maxSongs: 200,
            maxEventsPerMonth: 4,
            maxPeoplePerEvent: 15,
            durationDays: null, // Mensual
            active: true,
          },
          {
            name: 'Premium',
            type: 'PREMIUM',
            price: 50,
            currency: 'USD',
            maxMembers: 30,
            maxSongs: 500,
            maxEventsPerMonth: 10,
            maxPeoplePerEvent: 30,
            durationDays: null, // Mensual
            active: true,
          },
        ],
      });
      console.log('Initial subscription plans created.');
    }
  } */
}
