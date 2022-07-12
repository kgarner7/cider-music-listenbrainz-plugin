import lz from "lz-string";

import { PLUGIN_NAME, StorageType } from "../consts";
import type { Authorization } from "../providers/types";
import type { ProviderSetting } from "../types";

export interface GeneralData {
  debug: boolean;
  delay: number;
  filterLoop: boolean;
  nowPlaying: boolean;
}

export type BrainzData = Omit<ProviderSetting, "session">;

export type LibreData = Omit<ProviderSetting, "token" | "url">;

declare const app: {
  getLz(text: string): string;
}

declare const bootbox: {
  alert(msg: string): void;
}

export class StorageUtil {
  private static SETTINGS_KEY = "settings";

  public static handleLibreBackground(_event: Electron.IpcRendererEvent, data: Authorization) {
    const originalData = StorageUtil.libreData;

    if (data.ok) {
      originalData.session = data.key!;
      originalData.username = data.username;
    } else {
      originalData.enabled = false;
      originalData.session = null;
      originalData.username = null;
    }

    StorageUtil.libreData = originalData;
  }

  public static alert(message: string): void {
    bootbox.alert(`${app.getLz("term.requestError")}: ${message}`);
  }

  public static emptyGeneralData(): GeneralData {
    return {
      debug: false,
      delay: 50,
      filterLoop: false,
      nowPlaying: false
    };
  }

  public static get generalStorage(): GeneralData {
    const data = this.getStorage(StorageType.general);

    if (this.isGeneralData(data)) {
      return data;
    } else {
      const data = this.emptyGeneralData();
      this.generalStorage = data;

      return data;
    }
  }

  public static set generalStorage(value: GeneralData) {
    this.setStorage(StorageType.general, value);
  }

  public static emptyProviderData(): BrainzData {
    return {
      enabled: false,
      token: null,
      url: null,
      username: null
    };
  }

  public static getBrainzData(maloja: boolean): BrainzData {
    const key = maloja ? StorageType.maloja : StorageType.listenbrainz;

    const data = this.getStorage(key);

    if (this.isProviderSetting(data)) {
      return data;
    } else {
      const data = this.emptyProviderData();
      this.setBrainzData(data, maloja);

      return data;
    }
  }

  public static setBrainzData(data: BrainzData, maloja: boolean): void {
    this.setStorage(maloja ? StorageType.maloja : StorageType.listenbrainz, data);
  }

  public static emptyLibreData() {
    return {
      enabled: false,
      session: null,
      username: null
    };
  }

  public static get libreData(): LibreData {
    const data = this.getStorage(StorageType.libre);

    if (this.isLibreFMSetting(data)) {
      return data;
    } else {
      const data: LibreData = this.emptyLibreData();
      this.libreData = data;

      return data;
    }
  }

  public static set libreData(value: LibreData) {
    this.setStorage(StorageType.libre, value);
  }

  private static isGeneralData(data: any): data is GeneralData {
    if (data === undefined || data === null) return false;

    return (typeof data.debug === "boolean") &&
      (typeof data.delay === "number") &&
      (typeof data.filterLoop === "boolean") &&
      (typeof data.nowPlaying === "boolean");
  }

  private static isProviderSetting(data: any): data is ProviderSetting {
    if (data === undefined || data === null) return false;

    return (typeof data.enabled === "boolean") &&
      (data.token === null || typeof data.token === "string") &&
      (data.username === null || typeof data.username === "string") &&
      (data.url === null || typeof data.url === "string");
  }

  private static isLibreFMSetting(data: any): data is LibreData {
    if (data === undefined || data === null) return false;

    return (typeof data.enabled === "boolean") &&
      (data.session === null || typeof data.session === "string") &&
      (data.username === null || typeof data.username === "string");
  }

  public static getStorage(key: string, compress = false): any | null {
    let json = localStorage.getItem(
      `plugin.${PLUGIN_NAME}.${this.SETTINGS_KEY}.${key.toLocaleLowerCase()}`
    );

    if (compress && json !== null) {
      json = lz.decompress(json);
    }

    return json ? JSON.parse(json) : null;
  }

  public static setStorage(key: string, data: any, compress = false): void {
    let string = JSON.stringify(data);

    if (compress) {
      string = lz.compress(string);
    }

    localStorage.setItem(
      `plugin.${PLUGIN_NAME}.${this.SETTINGS_KEY}.${key.toLocaleLowerCase()}`,
      string
    );
  }
}