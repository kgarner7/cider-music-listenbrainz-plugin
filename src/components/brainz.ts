import Vue from "vue";
import { PLUGIN_NAME, StorageType } from "../consts";
import debounce from "../debounce";
import { Authorization } from "../providers/types";
import { BrainzData, StorageUtil } from "./util";

declare const ipcRenderer: Electron.IpcRenderer;

interface BrainsConfig extends BrainzData {
  app: any;
}

export default Vue.component(`plugin-${PLUGIN_NAME}-brainz`, {
  template: `
  <b-tab>
    <template #title>
      <div>{{ title }}</div>
    </template>
    <div class="settings-option-body">
      <div class="md-option-line">
        <div class="md-option-segment">
          <a
            v-if="isBaseListenbrainz"
            href="https://listenbrainz.org/profile"
            target="_blank"
            rel="noreferrer"
          >
            {{ app.getLz('settings.option.connectivity.lastfmScrobble').replace("Last.fm", title) }} token
          </a>
          <span v-else>
            {{ app.getLz('settings.option.connectivity.lastfmScrobble').replace("Last.fm", title) }} token
          </span>
          <span v-show="configured">
            ({{ username }})
          </span>
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input type="text" v-model.lazy="token" />
          </label>
        </div>
      </div>
      <div class="md-option-line">
        <div class="md-option-segment">
          {{ title }} URL
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input
              type="text"
              v-model.lazy="url"
              :placeholder="placeholder"
            />
          </label>
        </div>
      </div>
      <div v-show="configured" class="md-option-line">
        <div class="md-option-segment">
          {{ app.getLz("term.enable") }} {{ title }}
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input type="checkbox" switch v-model="enabled" />
          </label>
        </div>
      </div>
    </div>
  </b-tab>`,
  props: {
    placeholder: { type: String, required: true },
    title: { type: String, required: true },
  },
  data: function (): BrainsConfig {
    const data = StorageUtil.getBrainzData(this.title === StorageType.maloja);

    return { app: this.$root, ...data };
  },
  mounted() {
    this.handleChange = debounce(this.handleChange, 300) as VoidFunction;

    ipcRenderer.on(
      `plugin.${PLUGIN_NAME}.${this.title}.name`,
      (_event, auth: Authorization) => {
        if (auth.ok) {
          this.username = auth.username;
        } else {
          this.username = null;
          StorageUtil.alert(auth.error);
        }
      });
  },
  watch: {
    enabled() { this.handleChange() },
    token() { this.handleChange() },
    url() { this.handleChange() },
    username() { this.handleChange(false) }
  },
  computed: {
    isBaseListenbrainz(): boolean {
      return this.title === StorageType.listenbrainz && !this.url;
    },
    configured(): boolean {
      return !!this.token &&
        !!this.username &&
        (this.title !== StorageType.maloja || !!this.url)
    }
  },
  methods: {
    handleChange(notify = true) {
      const data: BrainzData = {
        enabled: this.enabled,
        token: this.token,
        url: this.url,
        username: this.username
      };

      StorageUtil.setBrainzData(data, this.title === StorageType.maloja);

      if (this.title === StorageType.listenbrainz) {
        // we only emit a username if we have a token (truthy), and are using the base URL
        this.$emit("username", this.token && !this.url ? this.username : null);
      }

      if (notify) {
        ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${this.title}`, data);
      }
    }
  }
})