import type {
  LoginWithSMS,
  LoginWithSMSError,
  PhoneNumber,
  User,
  RefreshToken,
} from '../models';
import client, { clientHandleError } from './client';

export class AuthClient {
  public static async sendCode(mobile: PhoneNumber): Promise<boolean> {
    const { status } = await client.post('/auth/sendCode', mobile);
    return status === 200 ? true : false;
  }

  /**
   * @summary Login with SMS
   */
  public static async loginWithSMS(
    verify: LoginWithSMS
  ): Promise<User | LoginWithSMSError> {
    try {
      const { data, headers }: { data: any; headers: RefreshToken } =
        await client.post('/auth/loginOrSignUpWithSMS', verify);

      // Save to LocalStorage
      localStorage.setItem('access-token', headers['x-jike-access-token']);
      localStorage.setItem('refresh-token', headers['x-jike-refresh-token']);

      return data.data.user as User;
    } catch (error) {
      return clientHandleError<LoginWithSMSError>(error);
    }
  }

  public static logout() {
    localStorage.removeItem('access-token');
    localStorage.removeItem('refresh-token');
  }
}
