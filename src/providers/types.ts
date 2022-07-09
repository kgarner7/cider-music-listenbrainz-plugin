interface NetError {
  error: Error;
  net: true;
}

interface HTTPError {
  code: number;
  net: false;
  msg: string;
}

export type RequestError = NetError | HTTPError;

interface AuthorizationSuccess {
  ok: true;
  key?: string;
  username: string;
}

interface AuthorizationFailure {
  ok: false;
  error: string;
}

export type Authorization = AuthorizationSuccess | AuthorizationFailure;

interface LibreTokenError {
  ok: false;
  msg: string
}

interface LibreTokenSuccess {
  ok: true;
  token: string;
  key: string;
}

export type LibreMessage = LibreTokenError | LibreTokenSuccess;

export interface Payload {
  track_metadata: {
    additional_info: {
      artist_mbids?: string[];
      duration_ms: number;
      isrc?: string;
      music_service?: "music.apple.com";
      origin_url?: string;
      recording_mbid?: string;
      tracknumber?: number;
    };
    artist_name: string;
    release_name?: string;
    track_name: string;
  }
}

interface NowPlayingSubmission {
  listen_type: "playing_now";
  payload: [Payload];
}

interface PayloadForSubmission extends Payload {
  listened_at: number;
}

interface SingleSubmission {
  listen_type: "single";
  payload: [PayloadForSubmission];
}

export type Submission = NowPlayingSubmission | SingleSubmission;