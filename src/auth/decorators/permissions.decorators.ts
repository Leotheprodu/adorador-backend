import { SetMetadata } from '@nestjs/common';

export const CHECK_USER_ID_KEY = 'checkUserId';
export type CheckUserIdType = string;
export const CheckUserId = (param: CheckUserIdType) =>
  SetMetadata(CHECK_USER_ID_KEY, param);

export const CHECK_LOGIN_STATUS = 'checkLoginStatus';
export type CheckLoginStatusType = 'loggedIn' | 'notLoggedIn';
export const CheckLoginStatus = (condition: CheckLoginStatusType) =>
  SetMetadata(CHECK_LOGIN_STATUS, condition);

export const APP_ROLE_KEY = 'appRoles';
export type AppRoleType = number[];
export const AppRole = (...roles: AppRoleType) =>
  SetMetadata(APP_ROLE_KEY, roles);

export const CHECK_CHURCH = 'checkChurch';
export type CheckChurchType = {
  checkBy:
    | 'paramUserId'
    | 'bodyChurchId'
    | 'paramChurchId'
    | 'paramMembershipId';
  key: string;
  churchRolesBypass?: number[];
  churchRoleStrict?: boolean;
};

export const CheckChurch = ({
  checkBy,
  key,
  churchRolesBypass,
  churchRoleStrict,
}: CheckChurchType) =>
  SetMetadata(CHECK_CHURCH, {
    checkBy,
    key,
    churchRolesBypass,
    churchRoleStrict,
  });
