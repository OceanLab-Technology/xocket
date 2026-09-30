export { apiClient, getToken, setToken } from './axios';

// Example service pattern:
//
// import { apiClient } from './axios'
//
// export const userService = {
//   getMe: () => apiClient.get<User>('/users/me'),
//   updateProfile: (data: Partial<User>) => apiClient.put<User>('/users/me', data),
// }
