export const environment = process.env.NODE_ENV;
export const frontEndUrl = process.env.FRONTEND_URL;
export const groupCampainEmailService = 'adorador';
export const tokenCampainEmailService = process.env.TOKEN_MAIL_CAMPAIN;

export const userRoles = {
  Admin: {
    id: 1,
    name: 'admin',
  },
  User: {
    id: 2,
    name: 'user',
  },
  Moderator: {
    id: 3,
    name: 'moderator',
  },
  Editor: {
    id: 4,
    name: 'editor',
  },
  Musician: {
    id: 5,
    name: 'musician',
  },
};
