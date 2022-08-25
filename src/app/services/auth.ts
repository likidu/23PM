import axios from 'axios';
import type { AxiosError } from 'axios';
import { useMutation, useQuery } from '@sveltestack/svelte-query';
import type {
  UseMutationOptions,
  MutationFunction,
} from '@sveltestack/svelte-query';
import type { AxiosPromise } from 'axios';
import type {
  Awaited,
  LoginWithSMS,
  LoginWithSMSError,
  PhoneNumber,
  User,
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
      const { data } = await client.post<User>(
        '/auth/loginOrSignUpWithSMS',
        verify
      );
      return data;
    } catch (error) {
      return clientHandleError<LoginWithSMSError>(error);
    }
  }
}
