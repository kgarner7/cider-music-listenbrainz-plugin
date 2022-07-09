import Vue from "vue";

import { PLUGIN_NAME, StorageType } from "./consts";

import Brainz from "./components/brainz";
import General from "./components/general";
import Libre from "./components/librefm";
import { StorageUtil } from "./components/util";
import type { Authorization } from "./providers/types";

declare const ipcRenderer: Electron.IpcRenderer;

declare const app: {
  appRoute(route: string): void;
  getLz(text: string): string;
}

declare const bootbox: {
  alert(msg: string): void;
}

declare namespace CiderFrontAPI {
  namespace Objects {
    class MenuEntry {
      id: string;
      name: string;
      onClick: VoidFunction;

      constructor();
    }
  }

  function AddMenuEntry(menu: Objects.MenuEntry): void;
}

declare const window: {
  open(url: string): void;
  uuidv4(): string;
};

interface ComponentSettings {
  pageIndex: number;
}

// Make it think that these exports are used
Brainz.version;
General.version;
Libre.version;

// Adapted from https://github.com/ChaseIngebritson/Cider-Music-Recommendation-Plugin/blob/e4f9d06ebfc6182983333dabb7d7946d744db010/src/components/musicRecommendations-vue.js
Vue.component(`plugin.${PLUGIN_NAME}`, {
  template: `
  <div class="content-inner settings-page">
    <b-tabs pills fill v-model="pageIndex">
      <plugin-${PLUGIN_NAME}-general />
      <plugin-${PLUGIN_NAME}-brainz title="${StorageType.listenbrainz}" placeholder="https://api.listenbrainz.org" />
      <plugin-${PLUGIN_NAME}-libre />
      <plugin-${PLUGIN_NAME}-brainz title="${StorageType.maloja}" placeholder="http://localhost:42010" />
    </b-tabs>
  </div>`,
  data: (): ComponentSettings => ({
    pageIndex: 0,
  })
});

class ListenbrainzFrontend {
  constructor() {
    const menuEntry = new CiderFrontAPI.Objects.MenuEntry();
    menuEntry.id = window.uuidv4();
    menuEntry.name = "Libre.fm, ListenBrainz, Maloja"
    menuEntry.onClick = () => {
      app.appRoute(`plugin/${PLUGIN_NAME}`);
    };

    CiderFrontAPI.AddMenuEntry(menuEntry);

    // Delete prior configuration.
    localStorage.removeItem(`plugin.${PLUGIN_NAME}.settings`);

    ipcRenderer.invoke(
      `plugin.${PLUGIN_NAME}.${StorageType.general}`, StorageUtil.generalStorage);

    const LIBRE = `plugin.${PLUGIN_NAME}.${StorageType.libre}`;
    ipcRenderer.once(`${LIBRE}.name`, (_event, auth: Authorization) => {
      const settings = StorageUtil.libreData;

      if (auth.ok) {
        settings.session = auth.key!;
        settings.username = auth.username;
      } else {
        settings.session = null;
        settings.username = null;
      }

      ipcRenderer.on(`${LIBRE}.name`, StorageUtil.handleLibreBackground);

      StorageUtil.libreData = settings;
    }).invoke(LIBRE, StorageUtil.libreData);

    function handleBrainz(maloja: boolean) {
      return function (_event: Electron.IpcRendererEvent, auth: Authorization) {
        const settings = StorageUtil.getBrainzData(maloja);

        if (auth.ok) {
          settings.username = auth.username;
        } else {
          settings.username = null;
        }

        StorageUtil.setBrainzData(settings, maloja);
      }
    }

    const LISTEN_BRAINZ = `plugin.${PLUGIN_NAME}.${StorageType.listenbrainz}`;
    ipcRenderer
      .once(`${LISTEN_BRAINZ}.name`, handleBrainz(false))
      .invoke(LISTEN_BRAINZ, StorageUtil.getBrainzData(false));

    const MALOJA = `plugin.${PLUGIN_NAME}.${StorageType.maloja}`;
    ipcRenderer
      .once(`${MALOJA}.name`, handleBrainz(true))
      .invoke(MALOJA, StorageUtil.getBrainzData(true));
  }
}

new ListenbrainzFrontend();
