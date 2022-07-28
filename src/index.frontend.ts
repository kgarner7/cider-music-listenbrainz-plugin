import Vue from "vue";

import { PLUGIN_NAME, StorageType } from "./consts";

import Brainz from "./components/brainz";
import General from "./components/general";
import Libre from "./components/librefm";
import Recommendations from "./components/recommendations";
import { StorageUtil } from "./components/util";
import debounce from "./debounce";
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

  class StyleSheets {
    static Add(sheet: string): void
  }

  function AddMenuEntry(menu: Objects.MenuEntry): void;
}

declare const window: {
  open(url: string): void;
  uuidv4(): string;
};

interface ComponentSettings {
  app: any;
  cached: Record<string, any>;
  pageIndex: number;
  pending: Array<[number, string]>;
  username: string | null;
}

// Make it think that these exports are used
Brainz.version;
General.version;
Libre.version;
Recommendations.version;

// Adapted from https://github.com/ChaseIngebritson/Cider-Music-Recommendation-Plugin/blob/e4f9d06ebfc6182983333dabb7d7946d744db010/src/components/musicRecommendations-vue.js
Vue.component(`plugin.${PLUGIN_NAME}`, {
  template: `
  <div class="content-inner settings-page">
  <mediaitem-list-item v-if="false" :item="song"/> 
    <b-tabs pills fill v-model="pageIndex">
      <plugin.${PLUGIN_NAME}.general />
      <plugin.${PLUGIN_NAME}.recommendation
        v-if="username"
        :username="username"
        :cached="cached"
        @cache="cacheChange"
      />
      <plugin.${PLUGIN_NAME}.brainz title="${StorageType.listenbrainz}" placeholder="https://api.listenbrainz.org" v-on:username="username = $event"/>
      <plugin.${PLUGIN_NAME}.libre />
      <plugin.${PLUGIN_NAME}.brainz title="${StorageType.maloja}" placeholder="http://localhost:42010" />
    </b-tabs>
  </div>`,
  data: function (): ComponentSettings {
    return {
      app: this.$root,
      cached: ListenbrainzFrontend.cached,
      pageIndex: 0,
      pending: [],
      username: StorageUtil.getBrainzData(false).username
    };
  },
  mounted(): void {
    this.fetchAll = debounce(this.fetchAll, 300) as () => Promise<void>;
  },
  methods: {
    cacheChange(id: string, score: number): void {
      this.pending.push([score, id]);

      this.fetchAll();
    },
    async fetchAll(): Promise<void> {
      // Why all this? The goal of this is to batch requests in 25, so as to reduce the load of sending out a massive load of requests at once.
      const items = this.pending;
      this.pending = [];

      items.sort((a, b) => b[0] - a[0]);

      const GROUP_SIZE = 25;

      for (let idx = 0; idx < items.length; idx += GROUP_SIZE) {
        const group = items.slice(idx, idx + GROUP_SIZE);
        await Promise.all(group.map(this.fetchItem));
        await StorageUtil.sleep(100);
      }
    },
    async fetchItem(item: [number, string]) {
      const id = item[1];
      try {
        const data = await this.app.mk.api.v3.music(`/v1/catalog/us/songs/${id}`);
        this.$set(this.cached, id, data.data.data[0]);
      } catch (error) {
        console.error("[plugin][%s]:", PLUGIN_NAME, error);
      }
    }
  }
});

class ListenbrainzFrontend {
  public static cached: Record<string, any> = {};

  public constructor() {
    const menuEntry = new CiderFrontAPI.Objects.MenuEntry();
    menuEntry.id = window.uuidv4();
    menuEntry.name = "Libre.fm, ListenBrainz, Maloja"
    menuEntry.onClick = () => {
      app.appRoute(`plugin/${PLUGIN_NAME}`);
    };

    CiderFrontAPI.AddMenuEntry(menuEntry);
    CiderFrontAPI.StyleSheets.Add(`./plugins/gh_504963482/listenbrainz.less`);

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

const BrainzFrontend = new ListenbrainzFrontend();

// Exports, just incase
export {
  Brainz, BrainzFrontend, General, Libre, Recommendations, StorageUtil, StorageType
};