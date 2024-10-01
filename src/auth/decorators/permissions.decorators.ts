import { SetMetadata } from '@nestjs/common';

export const CHECK_USER_ID_KEY = 'checkUserId';
export const CheckUserId = (param: string) =>
  SetMetadata(CHECK_USER_ID_KEY, param);

export const CHECK_LOGIN_STATUS = 'checkLoginStatus';
export const CheckLoginStatus = (condition: 'loggedIn' | 'notLoggedIn') =>
  SetMetadata(CHECK_LOGIN_STATUS, condition);

export const APP_ROLE_KEY = 'appRoles';
export const AppRole = (...roles: number[]) => SetMetadata(APP_ROLE_KEY, roles);

export const CHURCH_ROLE_KEY = 'churchRoles';
export const ChurchRole = (roles: number[], userIdParam: string) =>
  SetMetadata(CHURCH_ROLE_KEY, { roles, userIdParam });

export const CHECK_CHURCH = 'checkChurch';
export const CheckChurch = (checkBy: 'paramUserId', key: string) =>
  SetMetadata(CHECK_CHURCH, { checkBy, key });
