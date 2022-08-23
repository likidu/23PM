import axios, { AxiosRequestConfig } from 'axios';

const BASE_URL = 'https://api.xiaoyuzhoufm.com/v1/';

export const AXIOS_INSTANCE = axios.create({ baseURL: BASE_URL });

export const client = <T>(config: AxiosRequestConfig): Promise<T> => {
  const promise = AXIOS_INSTANCE(config).then(({ data }) => data);

  return promise;
};

export default client;
