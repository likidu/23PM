/**
 * Requests that does not require to save to stores
 */
import { httpClient, clientHandleError } from './httpClient';

import { user, tokens } from '../stores/user';
import { player } from '../stores/player';

import type { LoginWithSMS, AuthError, PhoneNumber, User, RefreshToken, SubscriptionMode } from '../models';

export class Client {
  static async sendCode(mobile: PhoneNumber): Promise<{} | AuthError> {
    try {
      const { data } = await httpClient.post('/auth/sendCode', mobile);
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
      const { data, headers }: { data: any; headers: RefreshToken } = await httpClient.post(
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
    player.reset();
  }

  /**
   * @summary Un/subscribe a podcast
   * @param pid Podcast ID
   * @param mode 'ON' or 'OFF
   * @return boolean
   */
  static async updateSubscription(pid: string, mode: SubscriptionMode): Promise<boolean> {
    try {
      const { data } = await httpClient.post('/subscription/update', {
        currentPageName: 9,
        pid,
        mode,
        sourcePageName: 33,
      });
      // Use return data has pid to determine subscription update status
      if (!data.data.pid) return false;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * @summary Remove episode from inbox
   * @param eid Episode ID
   */
  static async removeInbox(eid: string): Promise<boolean> {
    try {
      await httpClient.post('/inbox/remove', {
        eids: [eid],
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
