import { ipcMain } from "electron";
import { PLUGIN_NAME, StorageType } from "../consts";
import { ProviderSetting } from "../types";
import { BaseProvider } from "./baseProvider";
import { Authorization, LibreMessage, Payload, RequestError } from "./types";

// One minute
const CONNECTIVITY_TIMEOUT = 60_000;

interface LibreError {
  error: string | number;
  message: string;
}

function isLibreError(data: any): data is LibreError {
  return (typeof data.error === "string" || typeof data.error === "number") && typeof data.message === "string";
}

interface Token {
  token: string;
}

interface Session {
  session: {
    name: string;
    key: string;
    subscriber: number;
  }
}

export class LibreFMProvider extends BaseProvider {
  private connectTimer?: NodeJS.Timeout;

  public constructor() {
    super(StorageType.libre);
    this.urlencoded = true;

    ipcMain.handle(`plugin.${PLUGIN_NAME}.${StorageType.libre}.token`, async () => {
      return this.getAuthToken();
    })
  }

  protected getApiUrl(): string | undefined {
    return "https://libre.fm"
  }

  public async getAuthToken(): Promise<LibreMessage> {
    try {
      const data = await this.timeoutPromise(
        this.sendRequest<Token | LibreError>("2.0?method=auth.getToken&format=json"));

      if (isLibreError(data)) {
        return { ok: false, msg: data.message };
      } else {
        const token = data.token;

        this.settings.token = token;

        if (this.connectTimer) clearInterval(this.connectTimer);


        this.connectTimer = setTimeout(() => {
          this.authenticate();
        }, CONNECTIVITY_TIMEOUT);

        return { ok: true, token, key: this.apiKey() };
      }
    } catch (error) {
      return {
        ok: false,
        msg: (error as Error).message
      }
    }
  }

  public scrobbleSong(payload: Payload, scrobbledAt: Date): void {
    const submission = new URLSearchParams({
      method: "track.scrobble",
      track: payload.track_metadata.track_name,
      artist: payload.track_metadata.artist_name,
      sk: this.settings.session!,
      format: "json",
      mbid: payload.track_metadata.additional_info.recording_mbid ?? "",
      timestamp: Math.floor(scrobbledAt.getTime() / 1000).toString()
    });

    this.timeoutPromise(this.sendRequest("2.0/", submission))
      .then(() => { })
      .catch(error => {
        console.error("[Plugin][%s]", PLUGIN_NAME, error)
      });
  }

  public updateListening(payload: Payload): void {
    const submission = new URLSearchParams({
      method: "track.updatenowplaying",
      track: payload.track_metadata.track_name,
      artist: payload.track_metadata.artist_name,
      sk: this.settings.session!,
      format: "json",
      mbid: payload.track_metadata.additional_info.recording_mbid ?? ""
    });

    this.timeoutPromise(this.sendRequest("2.0/", submission.toString()))
      .then(() => { })
      .catch(error => {
        console.error("[Plugin][%s]", PLUGIN_NAME, error)
      });
  }

  public update(settings: ProviderSetting): void {
    // If we have no session, then either we just started, or we are attempting to authenticate.
    if (!this.settings.session) {
      // Only update the username when we lack a session; if we have one, we know it is valid
      if (this.settings.username !== settings.username) {
        this.settings.username = settings.username;
      }

      this.settings.enabled = settings.enabled;

      if (settings.session) {
        this.settings.session = settings.session;
      } else if (this.settings.token) {
        this.settings.username = null;
        this.authenticate();
      }
    } else {
      if (!settings.session) {
        this.settings.enabled = false;
        this.settings.session = null;
        this.settings.token = null;
        this.settings.username = null;
      } else {
        this.settings.enabled = settings.enabled;
      }
    }
  }

  protected async auth(): Promise<Authorization> {
    if (this.connectTimer) {
      clearInterval(this.connectTimer);
      this.connectTimer = undefined;
    }

    try {
      const search = new URLSearchParams({
        format: "json",
        token: this.settings.token!,
        api_key: this.apiKey(),
        method: "auth.getSession"
      });

      const data = await this.timeoutPromise(this.sendRequest<LibreError | Session>(
        `2.0?${search.toString()}`,
        undefined,
        "GET"
      ));


      if (isLibreError(data)) {
        this.settings.enabled = false;
        return { ok: false, error: data.message };
      } else {
        this.settings.session = data.session.key;
        this.settings.username = data.session.name;

        return { ok: true, key: data.session.key, username: data.session.name };
      }
    } catch (error) {
      this.settings.enabled = false;
      const reqError = error as RequestError;

      if (reqError.net) {
        return { ok: false, error: reqError.error.message };
      } else {
        return { ok: false, error: reqError.msg };
      }
    }
  }

  private apiKey(): string {
    return "Z9YwDsJm3EFauHkuLNPnTNN2DUv25SP7rxeAQxsn";
  }
}