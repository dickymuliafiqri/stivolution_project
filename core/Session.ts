/**
 * by dickymuliafiqri
 *
 * Used to save users session
 */

export interface UserDataInterface {
  [UserId: number]: {
    UserId?: number;
    NIM?: number;
    Password?: string;
    Session?: string;
  };
}

export let userDataList: UserDataInterface = {};
