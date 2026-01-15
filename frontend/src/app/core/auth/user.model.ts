export interface User {
  id?: number;
  username: string;
  name: string;
  email?: string;
  provider?: string;
  provider_id?: string;
  avatar?: string;
}
