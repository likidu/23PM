import type { PhoneNumber } from './Auth';
import type { Avatar } from './Image';

type Gender = typeof Gender[keyof typeof Gender];

// eslint-disable-next-line @typescript-eslint/no-redeclare
const Gender = {
  MALE: 'MALE',
  FEAMALE: 'FEAMALE',
} as const;

export interface User {
  type: 'USER';
  uid: string;
  avatar: Avatar;
  nickname: string;
  isNicknameSet: boolean;
  gender: Gender;
  isCancelled: boolean;
  birthYear: number;
  industry: string;
  phoneNumber: PhoneNumber;
  debug: boolean;
}
