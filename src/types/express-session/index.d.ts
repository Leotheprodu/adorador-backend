import { SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: number;
    isLoggedIn: boolean;
    roles: number[];
    name: string;

    memberships: {
      id: number;
      church: { id: number; name: string };
      roles: { id: number; name: string; churchRoleId: number }[];
      since: Date;
    }[];
    membersofBands: {
      id: number;
      isAdmin: boolean;
      isEventManager: boolean;
      role: string;
      band: {
        id: number;
        name: string;
      };
    }[];
  }
}
