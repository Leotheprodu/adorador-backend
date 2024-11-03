import { environment } from 'config/constants';
import * as expressSession from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { PrismaClient } from '@prisma/client';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export const sessionMiddleware = expressSession({
  name: 'sessionId',
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: environment === 'production',
    sameSite: environment === 'production' ? 'none' : false,
  },
  secret: 'vive en una piña debajo del mar',
  resave: true,
  saveUninitialized: false,
  store: new PrismaSessionStore(new PrismaClient(), {
    checkPeriod: 2 * 60 * 1000,
    dbRecordIdIsSessionId: true,
    dbRecordIdFunction: undefined,
    sessionModelName: 'session',
  }),
});
