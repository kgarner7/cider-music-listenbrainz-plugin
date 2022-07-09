import type { StorageType } from "./consts";
import type { Authorization } from "./providers/types";

export type Provider = "listenbrainz" | "librefm" | "maloja";

export type AuthResponse = [StorageType, Authorization];

export interface ProviderSetting {
  enabled: boolean;
  session: string | null;
  token: string | null;
  username: string | null;
  url: string | null;
}

