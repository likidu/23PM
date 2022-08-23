/**
 * Generated by orval v6.9.6 🍺
 * Do not edit manually.
 * Swagger Petstore
 * OpenAPI spec version: 1.0.0
 */
import type { UserType } from './userType';
import type { Avatar } from './avatar';
import type { UserGender } from './userGender';
import type { PhoneNumber } from './phoneNumber';

export interface User {
  type?: UserType;
  uid?: string;
  /** User avatar */
  avatar?: Avatar;
  nickname?: string;
  isNicknameSet?: boolean;
  gender?: UserGender;
  isCancelled?: boolean;
  birthYear?: number;
  industry?: string;
  /** User phone number */
  phoneNumber?: PhoneNumber;
  debug?: boolean;
}