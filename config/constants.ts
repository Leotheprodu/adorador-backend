export const environment = process.env.NODE_ENV;
export const frontEndUrl = process.env.FRONTEND_URL;
export const groupCampainEmailService = 'adorador';
export const tokenCampainEmailService = process.env.TOKEN_MAIL_CAMPAIN;

export const userRoles = {
  admin: {
    id: 1,
    name: 'admin',
  },
  user: {
    id: 2,
    name: 'user',
  },
  moderator: {
    id: 3,
    name: 'moderator',
  },
  editor: {
    id: 4,
    name: 'editor',
  },
};

export const churchRoles = {
  pastor: {
    id: 1,
    name: 'Pastor',
  },
  worshipLeader: {
    id: 2,
    name: 'Líder de Alabanza',
  },
  musician: {
    id: 3,
    name: 'Músico',
  },
  youthLeader: {
    id: 4,
    name: 'Líder de Jóvenes',
  },
  deacon: {
    id: 5,
    name: 'Diácono',
  },
  teacher: {
    id: 6,
    name: 'Maestro',
  },
  evangelist: {
    id: 7,
    name: 'Evangelista',
  },
  intercessor: {
    id: 8,
    name: 'Intercesor',
  },
  counselor: {
    id: 9,
    name: 'Consejero',
  },
  treasurer: {
    id: 10,
    name: 'Tesorero',
  },
  cousilOfElders: {
    id: 11,
    name: 'Consejo de Ancianos',
  },
  danceAndTheater: {
    id: 12,
    name: 'Danza y Teatro',
  },
};
