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

export interface UserFloodControlInterface {
  [UserId: number]: [
    {
      command: string;
      number: number;
    }
  ];
}

export interface BannedUserInterface {
  [UserId: number]: {
    minute: number;
    warned: boolean;
  };
}

export let bannedUser: BannedUserInterface = {};
export let userFloodControl: UserFloodControlInterface = {};
export let userDataList: UserDataInterface = {};

export function flushFloodRecord() {
  userFloodControl = {};
}

export function bannedTimeCounter() {
  Object.keys(bannedUser).forEach((userId) => {
    const minute = bannedUser[Number(userId)].minute;
    if (minute > 0) {
      bannedUser[Number(userId)] = {
        minute: minute - 1,
        warned: false
      };
    } else {
      delete bannedUser[Number(userId)];
    }
  });
}
