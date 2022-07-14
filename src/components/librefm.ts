import Vue from "vue";
import { PLUGIN_NAME, StorageType } from "../consts";
import debounce from "../debounce";
import { Authorization, LibreMessage } from "../providers/types";
import { LibreData, StorageUtil } from "./util";

interface LibreSettings extends LibreData {
  app: Vue;
  // Token is explicitly ignored
  token: string | null;
  waiting: boolean;
}

declare const ipcRenderer: Electron.IpcRenderer;

export default Vue.component(`plugin-${PLUGIN_NAME}-libre`, {
  template: `
  <b-tab>
    <template #title>
      <div>Libre.fm</div>
    </template>
    <div class="settings-option-body">
      <div class="md-option-line">
        <div class="md-option-segment">
          <span>Libre.fm</span>
          <span v-show="session !== null">
            ({{ username }})
          </span>
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <button class="md-btn" id="libreConnect" @click="connectLibre()" :disabled="waiting">
            {{ 
              app.getLz("term." + (connecting ? "disconnect": "connect")) 
            }}
          </button>
        </div>
      </div>
      <div v-show="connecting">
        <div class="md-option-line">
          <div class="md-option-segment">
            {{ app.getLz("term.enable") }} Libre.fm
          </div>
          <div class="md-option-segment md-option-segment_auto">
            <label>
              <input type="checkbox" switch v-model="enabled" />
            </label>
          </div>
        </div>
      </div>
    </div>
  </b-tab>`,

  data: function (): LibreSettings {
    return {
      app: this.$root,
      token: null,
      waiting: false,
      ...StorageUtil.libreData
    }
  },
  mounted() {
    this.handleChange = debounce(this.handleChange, 300) as VoidFunction;

    const event = `plugin.${PLUGIN_NAME}.${StorageType.libre}.name`

    ipcRenderer
      .off(event, StorageUtil.handleLibreBackground)
      .on(event, (_event, auth: Authorization) => {
        if (auth.ok) {
          this.session = auth.key || null;
          this.username = auth.username;
        } else {
          this.enabled = false;
          StorageUtil.alert(auth.error);
        }
      });
  },
  destroyed() {
    ipcRenderer.on(`plugin.${PLUGIN_NAME}.${StorageType.libre}.name`, StorageUtil.handleLibreBackground);
  },
  watch: {
    enabled(newVal: boolean, oldVal: boolean) {
      // We ignore this change if setting enabled -> false while the user  is not authenticated.
      const shouldIgnore = !newVal && oldVal && !this.session;
      this.handleChange(!shouldIgnore);
    },
    session() { this.handleChange(true) }
  },
  computed: {
    connecting() {
      return this.token !== null || this.session !== null;
    }
  },
  methods: {
    handleChange(notify: boolean) {
      const data: LibreData = {
        enabled: this.enabled,
        session: this.session,
        username: this.username
      };
      StorageUtil.libreData = data;

      if (notify) {
        ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${StorageType.libre}`, data);
      }
    },
    async connectLibre() {
      if (this.connecting) {
        this.enabled = false;
        this.session = null;
        this.token = null;
        this.username = null;
        this.waiting = false;
      } else {
        this.waiting = true;

        try {
          const url: LibreMessage = await ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${StorageType.libre}.token`);

          if (url.ok) {
            const target = `https://libre.fm/api/auth/?api_key=${url.key}&token=${url.token}`;
            window.open(target);

            this.token = url.token;
          } else {
            throw new Error(url.msg);
          }
        } catch (error) {
          StorageUtil.alert((error as Error).message);
        } finally {
          this.waiting = false;
        }
      }
    }
  }
})