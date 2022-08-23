import axios from 'axios';
import type { AxiosRequestConfig, AxiosPromise, AxiosError } from 'axios';
import type { RefreshTokenResponse } from '../models';
import { API_ENDPOINT, API_CONFIG } from './config';

/**
 * @summary Refresh expired token
 * @param refreshToken
 * @returns {AxiosPromise<RefreshToken>} x-jike-access-token, x-jike-refresh-token, success
 */
const appAuthTokensRefresh = (
  refreshToken: string
): AxiosPromise<RefreshTokenResponse> => {
  const params = new URLSearchParams({
    'x-jike-refresh-token': refreshToken,
  });
  return client.post(`${API_ENDPOINT}/app_auth_tokens.refresh`, params);
};

const client = axios.create(API_CONFIG);

// Request interceptor for API calls
client.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('access-token');
    if (token) config.headers['x-jike-access-token'] = token;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for API calls
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError): Promise<AxiosError> => {
    const { config, response } = error;

    // Add a retry property
    const originalRequest = {
      retry: false,
      ...config,
    };

    /*
     * When response code is 401, try to refresh the token.
     * Eject the interceptor so it doesn't loop in case
     * token refresh causes the 401 response
     */
    if (response && response.status === 401 && !originalRequest.retry) {
      originalRequest.retry = true;

      const refreshToken = localStorage.getItem('refresh-token');
      if (refreshToken) {
        const { data } = await appAuthTokensRefresh(refreshToken);

        if (JSON.parse(data.success) === 'true') {
          // TODO: fix the type
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          client.defaults.headers.common['x-jike-access-token'] =
            data['x-jike-access-token'];

          // TODO: use DB to store tokens
          localStorage.setItem('access-token', data['x-jike-access-token']);
          localStorage.setItem('refresh-token', data['x-jike-refresh-token']);

          client(originalRequest);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default client;
