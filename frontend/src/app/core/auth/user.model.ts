export interface User {
  id?: number;
  username: string;
  name: string;
  email?: string;
  emailVerifiedAt?: string | null;
  provider?: string;
  provider_id?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}
