import { apiFetch } from './client';
import type { UserProfileView } from './types';

export const userApi = {
  profile: () => apiFetch<UserProfileView>('/user/profile'),
};
