import { SessionData } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: number;
    isLoggedIn: boolean;
    roles: number[];

    memberships: {
      id: number;
      church: { id: number; name: string };
      roles: { id: number; name: string; churchRoleId: number }[];
      since: Date;
    }[];
  }
}
