import { SetMetadata } from '@nestjs/common';

export const CHECK_USER_ID_KEY = 'checkUserId';
export const CheckUserId = (param: string) =>
  SetMetadata(CHECK_USER_ID_KEY, param);

export const APP_ROLE_KEY = 'appRoles';
export const AppRole = (...roles: number[]) => SetMetadata(APP_ROLE_KEY, roles);

export const CHURCH_ROLE_KEY = 'churchRoles';
export const ChurchRole = (roles: number[], churchParam: string) =>
  SetMetadata(CHURCH_ROLE_KEY, { roles, churchParam });
