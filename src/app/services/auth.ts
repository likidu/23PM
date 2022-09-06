import { get } from 'svelte/store';
import client, { clientHandleError } from './client';

import { user, tokens } from '../stores/user';

import type { LoginWithSMS, AuthError, PhoneNumber, User, RefreshToken } from '../models';

export class AuthClient {
  static async sendCode(mobile: PhoneNumber): Promise<{} | AuthError> {
    try {
      const { data } = await client.post('/auth/sendCode', mobile);
      console.warn(`sendCode(): ${JSON.stringify(data)}`);
      return data;
    } catch (error) {
      console.error(`sendCode(): ${JSON.stringify(error)}`);
      return clientHandleError<AuthError>(error);
    }
  }

  /**
   * @summary Login with SMS
   */
  static async loginWithSMS(verify: LoginWithSMS): Promise<User | AuthError> {
    try {
      const { data, headers }: { data: any; headers: RefreshToken } = await client.post(
        '/auth/loginOrSignUpWithSMS',
        verify,
      );

      // Update token store and save to LocalStorage
      tokens.update({
        accessToken: headers['x-jike-access-token'],
        refreshToken: headers['x-jike-refresh-token'],
      });

      return data.data.user as User;
    } catch (error) {
      return clientHandleError<AuthError>(error);
    }
  }

  static logout() {
    user.reset();
    tokens.reset();
  }
}
