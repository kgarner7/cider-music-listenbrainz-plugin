import Vue from "vue";
import { PLUGIN_NAME, StorageType } from "../consts";
import debounce from "../debounce";
import { StorageUtil } from "./util";

declare const ipcRenderer: Electron.IpcRenderer;

export default Vue.component(`plugin.${PLUGIN_NAME}.general`, {
  name: "",
  template: `
  <b-tab>
    <template #title>
      <div>{{ $root.getLz('settings.header.general') }}</div>
    </template>
    <div class="settings-option-body">
      <div class="md-option-line">
        <div class="md-option-segment">
          {{ app.getLz('settings.option.connectivity.lastfmScrobble.delay').replace("Last.fm", "") }}
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input type="number" min="50" max="90" v-model.number.lazy="settings.delay" />
          </label>
        </div>
      </div>
      <div class="md-option-line">
        <div class="md-option-segment">
          {{ app.getLz('settings.option.connectivity.lastfmScrobble.nowPlaying').replace("Last.fm", "") }}
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input type="checkbox" switch v-model="settings.nowPlaying" />
          </label>
        </div>
      </div>
      <div class="md-option-line">
        <div class="md-option-segment">
          {{ app.getLz('settings.option.connectivity.lastfmScrobble.filterLoop').replace("(Last.fm)", "") }}
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input type="checkbox" switch v-model="settings.filterLoop" />
          </label>
        </div>
      </div>
      <div class="md-option-line">
        <div class="md-option-segment">
          {{ app.getLz('settings.header.debug') }}
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input type="checkbox" switch v-model="settings.debug" />
          </label>
        </div>
      </div>
    </div>
  </b-tab>`,
  data: function () {
    return {
      app: this.$root,
      settings: StorageUtil.generalStorage
    }
  },
  mounted() {
    this.handleChange = debounce(this.handleChange, 300) as VoidFunction;
  },
  watch: {
    settings: {
      deep: true,
      handler() {
        this.handleChange()
      }
    }
  },
  methods: {
    handleChange() {
      StorageUtil.generalStorage = this.settings;
      ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.${StorageType.general}`, this.settings);
    }
  }
})