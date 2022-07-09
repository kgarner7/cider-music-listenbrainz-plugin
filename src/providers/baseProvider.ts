import { ipcMain } from "electron";
import { PLUGIN_NAME, StorageType } from "../consts";
import { USER_AGENT } from "../consts-backend";
import type { ProviderSetting } from "../types";
import { Payload, Authorization, RequestError, LibreMessage } from "./types";

type ProviderType = StorageType.libre | StorageType.listenbrainz | StorageType.maloja;

export class BaseProvider {
  protected static readonly TIMEOUT_MS = 10_000;

  private static env: any;
  private static net: Electron.Net;

  protected readonly provider: ProviderType;
  protected settings: ProviderSetting;
  protected urlencoded: boolean = false;

  public static init(env: any, net: Electron.Net) {
    this.env = env;
    this.net = net;
  }

  public constructor(provider: ProviderType) {
    this.settings = {
      enabled: false,
      session: null,
      token: null,
      url: null,
      username: null
    };
    this.provider = provider;

    ipcMain.handle(`plugin.${PLUGIN_NAME}.${this.provider}`, (_event, settings: ProviderSetting) => {
      this.update(settings);
    });
  }

  public enabled(): boolean {
    return this.settings.enabled && this.settings.username !== undefined;
  }

  public async getAuthToken(): Promise<LibreMessage> {
    throw new Error("This function must be overridden");
  }

  public scrobbleSong(_payload: Payload, _scrobbledAt: Date): void {
    throw new Error("This function must be overridden");
  }

  public updateListening(_payload: Payload): void {
    throw new Error("This function must be overridden");
  }

  protected update(_settings: ProviderSetting): void {
    throw new Error("This function must be overridden");
  }

  protected async authenticate(): Promise<void> {
    try {
      let auth: Authorization;

      try {
        auth = await this.timeoutPromise(this.auth());

      } catch (error) {
        auth = {
          ok: false,
          error: (error as Error).message
        };
      }

      BaseProvider.env.utils.getWindow().webContents.send(`plugin.${PLUGIN_NAME}.${this.provider}.name`, auth);

      this.settings.username = auth.ok ? auth.username : null;
      this.settings.session = auth.ok ? (auth.key || null) : null;
    } catch (error) {
      // We should never get here, but just in case.
      console.error("[Plugin][%s]: Error when authenticating ", error);
    }
  }

  protected async auth(): Promise<Authorization> {
    throw new Error("This function must be overridden");
  }

  protected getApiUrl(): string | undefined {
    throw new Error("This function must be overridden");
  }

  protected static logError(error: RequestError): void {
    if (!error.net) {
      console.error("[Plugin][%s]: %s (status code %d)", PLUGIN_NAME, error.msg, error.code);
    } else {
      console.error("[Plugin][%s]: ", PLUGIN_NAME, error.error);
    }
  }

  protected async timeoutPromise<T>(
    promise: Promise<T>,
    timeoutMs = BaseProvider.TIMEOUT_MS
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timed out after ${timeoutMs} ms`));
      }, timeoutMs);

      promise.then(res => {
        clearTimeout(timeoutId);
        resolve(res);
      }).catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      })
    })
  }

  protected async sendRequest<T>(
    endpoint: string,
    jsonBody?: any,
    method = "POST"
  ): Promise<T> {
    return new Promise((resolve: (value: T) => void, reject: (value: RequestError) => void) => {
      const request = BaseProvider.net.request({
        url: `${this.getApiUrl()}/${endpoint}`,
        method: method
      });

      if (this.provider !== StorageType.libre) {
        request.setHeader("Authorization", `Token ${this.settings.token}`);
      }

      request.setHeader("User-Agent", USER_AGENT);

      request.on("response", (response) => {
        let body = "";

        response.on("end", () => {
          try {
            const respJson = JSON.parse(body);

            // A response is only OK if it has HTTP code 200.
            if (response.statusCode === 200) {
              resolve(respJson);
            } else {
              reject({ code: response.statusCode, net: false, msg: respJson.error, });
            }
          } catch (error) {
            reject({ error: error as Error, net: true });
          }
        });

        response.on("data", chunk => {
          body += chunk.toString("utf-8");
        });
      });

      request.on("error", error => {
        reject({ error, net: true });
      });

      // If we have a body (e.g., not validate-token), send that
      if (jsonBody) {
        if (this.urlencoded) {
          request.setHeader("Content-Type", "application/x-www-form-urlencoded");
          request.write(new URLSearchParams(jsonBody).toString(), "utf-8");
        } else {
          request.setHeader("Content-Type", "application/json");
          request.write(JSON.stringify(jsonBody), "utf-8");
        }
      }

      request.end();
    })
  }
}