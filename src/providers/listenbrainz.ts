import { StorageUtil } from "../components/util";
import { PLUGIN_NAME, StorageType } from "../consts";
import { ProviderSetting } from "../types";
import { BaseProvider } from "./baseProvider";
import { Payload, Submission, RequestError, Authorization } from "./types";

interface Validation {
  code: number,
  message: string,
  valid: boolean,
  user_name: string
}

export class ListenBrainzProvider extends BaseProvider {
  public constructor(
    provider: StorageType.listenbrainz | StorageType.maloja
  ) {
    super(provider);
  }

  /** @override */
  public getApiUrl(): string | undefined {
    if (this.provider === StorageType.listenbrainz) {
      return this.settings.url || "https://api.listenbrainz.org";
    } else {
      if (this.settings.url !== undefined) {
        return `${this.settings.url}/apis/listenbrainz`;
      } else {
        return undefined;
      }
    }
  }

  /** @override */
  public scrobbleSong(payload: Payload, scrobbledAt: Date): void {
    const submission: Submission = {
      listen_type: "single", payload: [{
        listened_at: Math.floor(scrobbledAt.getTime() / 1000),
        ...payload
      }]
    };

    new Promise<void>(async resolve => {
      for (let tries = 1; tries <= 5; tries++) {
        try {
          await this.timeoutPromise(
            this.sendRequest("1/submit-listens", submission));
        } catch (error) {
          const err = error as RequestError;
          BaseProvider.logError(err as RequestError);

          if (err.net || err.code !== 503) {
            break;
          }

          // Sleep for 10 seconds * how many tries we've made
          await StorageUtil.sleep(10_000 * tries);
        }
      }

      resolve();
    })
      .then(() => { })
      .catch(error => {
        console.error("[Plugin][%s]: ", PLUGIN_NAME, error);
      });
  }

  /** @override */
  public updateListening(payload: Payload): void {
    if (this.provider === StorageType.maloja) {
      // Maloja does not support now playing
      return;
    } else {
      const submission: Submission = {
        listen_type: "playing_now", payload: [payload]
      };

      this.timeoutPromise(this.sendRequest("/1/submit-listens", submission))
        .catch(BaseProvider.logError);
    }
  }

  /** @override */
  public update(settings: ProviderSetting): void {
    const needsAuth = this.settings.token !== settings.token || this.settings.url !== settings.url;

    this.settings = settings;

    if (
      needsAuth && this.settings.token &&
      (this.provider === StorageType.listenbrainz || this.settings.url)
    ) {
      this.settings.username = null;
      this.authenticate();
    }
  }

  protected async auth(): Promise<Authorization> {
    try {
      const data = await this.timeoutPromise(this.sendRequest<Validation>(
        "1/validate-token", undefined, "GET"
      ));

      if (data.valid) {
        return { ok: true, username: data.user_name };
      } else {
        return { ok: false, error: data.message };
      }
    } catch (error) {
      const reqError = error as RequestError;

      if (reqError.net) {
        return { ok: false, error: reqError.error.message };
      } else {
        return { ok: false, error: reqError.msg };
      }
    }
  }
}