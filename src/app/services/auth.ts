import type { LoginWithSMS, AuthError, PhoneNumber, User, RefreshToken } from '../models';
import client, { clientHandleError } from './client';

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

      // Save to LocalStorage
      localStorage.setItem('access-token', headers['x-jike-access-token']);
      localStorage.setItem('refresh-token', headers['x-jike-refresh-token']);

      return data.data.user as User;
    } catch (error) {
      return clientHandleError<AuthError>(error);
    }
  }

  static logout() {
    localStorage.removeItem('access-token');
    localStorage.removeItem('refresh-token');
  }
}
