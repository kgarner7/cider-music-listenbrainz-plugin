interface AuthError {
  ok: false;
  error: string;
}

interface AuthSuccess {
  ok: true;
  name: string;
}

export type AuthResponse = AuthError | AuthSuccess;

export interface Settings {
  debug: boolean;
  delay: number;
  enabled: boolean;
  filterLoop: boolean;
  nowPlaying: boolean;
  removeFeatured: boolean;
  token?: string;
  username?: string;
}
