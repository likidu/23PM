/**
 * Authorizations
 */
export interface RefreshToken {
  'x-jike-access-token': string;
  'x-jike-refresh-token': string;
}

export interface RefreshTokenResponse extends RefreshToken {
  success: 'true' | 'false';
}

export type PhoneNumber = {
  mobilePhoneNumber: string;
  areaCode: string;
};

export type LoginWithSMS = PhoneNumber & { verifyCode: string };

export type LoginWithSMSError = {
  success: boolean;
  code: number;
  toast: string;
};
