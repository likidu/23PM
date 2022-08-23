import { useMutation } from '@sveltestack/svelte-query';
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
} from '../models';
import client from './client';

export class AuthClient {
  public static async sendCode(mobile: PhoneNumber): Promise<boolean> {
    const { status } = await client.post('/auth/sendCode', mobile);
    return status === 200 ? true : false;
  }

  public static loginWithSMS() {
    client.post('/auth/loginOrSignUpWithSMS');
  }
}

/**
 * @summary Login with SMS
 */

const loginWithSMS = (verify: LoginWithSMS) => {
  client.post('/auth/loginOrSignUpWithSMS', verify);
};

export const useLoginWithSMS = <
  TError = LoginWithSMSError,
  TContext = unknown
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof loginWithSMS>>,
    TError,
    { data: LoginWithSMS },
    TContext
  >;
}) => {
  const { mutation: mutationOptions } = options ?? {};

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof loginWithSMS>>,
    { data: LoginWithSMS }
  > = (props) => {
    const { data } = props ?? {};

    return loginWithSMS(data);
  };

  return useMutation<
    Awaited<ReturnType<typeof loginWithSMS>>,
    TError,
    { data: LoginWithSMS },
    TContext
  >(mutationFn, mutationOptions);
};
