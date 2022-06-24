const PLUGIN_NAME = "listenbrainz";
const SETTINGS_KEY = "settings";

function getLocalStorage() {
  try {
    const data = localStorage.getItem(`plugin.${PLUGIN_NAME}.${SETTINGS_KEY}`);
    return JSON.parse(data);
  } catch (error) {
    updateLocalStorage(null);
    return null;
  }
}

function updateLocalStorage(data) {
  localStorage.setItem(`plugin.${PLUGIN_NAME}.${SETTINGS_KEY}`, JSON.stringify(data));
}

let username = undefined;

// Adapted from https://github.com/ChaseIngebritson/Cider-Music-Recommendation-Plugin/blob/e4f9d06ebfc6182983333dabb7d7946d744db010/src/components/musicRecommendations-vue.js
Vue.component("plugin.listenbrainz", {
  template: `
  <div class="content-inner settings-page">
    <div class="md-option-header mt-3">
      <span>ListenBrainz</span>
    </div>
    <div class="settings-option-body">
      <div class="md-option-line">
        <div class="md-option-segment">
          <a
            href="https://listenbrainz.org/login/musicbrainz?next=%2Fprofile%2F" target="_blank" rel="noreferrer">
              {{ app.getLz('settings.option.connectivity.lastfmScrobble') }} token
          </a>
          <span v-show="settings.username !== undefined">
            ({{ settings.username }})
          </span>
        </div>
        <div class="md-option-segment md-option-segment_auto">
          <label>
            <input type="text" v-model="settings.token" />
          </label>
        </div>
      </div>
      <div v-show="settings.username !== undefined">
        <div class="md-option-line">
          <div class="md-option-segment">
            {{ app.getLz("term.enable") }} ListenBrainz
          </div>
          <div class="md-option-segment md-option-segment_auto">
            <label>
              <input type="checkbox" switch v-model="settings.enabled" />
            </label>
          </div>
        </div>
        <div class="md-option-line" v-show="settings.enabled && settings.username != undefined">
          <div class="md-option-segment">
            {{ app.getLz('settings.option.connectivity.lastfmScrobble.delay').replace("Last.fm", "ListenBrainz") }}
          </div>
          <div class="md-option-segment md-option-segment_auto">
            <label>
              <input type="number" min="50" max="100" v-model="settings.delay" />
            </label>
          </div>
        </div>
        <div class="md-option-line" v-show="settings.enabled && settings.username != undefined">
          <div class="md-option-segment">
            {{ app.getLz('settings.option.connectivity.lastfmScrobble.nowPlaying').replace("Last.fm", "ListenBrainz") }}
          </div>
          <div class="md-option-segment md-option-segment_auto">
            <label>
              <input type="checkbox" switch v-model="settings.nowPlaying" />
            </label>
          </div>
        </div>
        <div class="md-option-line" v-show="settings.enabled && settings.username != undefined">
          <div class="md-option-segment">
            {{ app.getLz('settings.option.connectivity.lastfmScrobble.filterLoop').replace("Last.fm", "ListenBrainz") }}
          </div>
          <div class="md-option-segment md-option-segment_auto">
            <label>
              <input type="checkbox" switch v-model="settings.filterLoop" />
            </label>
          </div>
        </div>
        <div class="md-option-line" v-show="settings.enabled && settings.username != undefined">
          <div class="md-option-segment">
            {{ app.getLz('settings.option.connectivity.lastfmScrobble.removeFeatured').replace("Last.fm", "ListenBrainz") }}
          </div>
          <div class="md-option-segment md-option-segment_auto">
            <label>
              <input type="checkbox" switch v-model="settings.removeFeatured" />
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
  `,
  data: () => ({
    settings: {
      delay: 50,
      enabled: false,
      filterLoop: false,
      nowPlaying: false,
      removeFeatured: false,
      token: undefined,
      username: undefined
    },
  }),
  watch: {
    settings: {
      deep: true,
      handler() {
        updateLocalStorage(this.settings);
        ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.setting`, this.settings);
      }
    }
  },
  async mounted() {
    const settings = getLocalStorage('settings');

    if (username) {
      settings.username = username;
    }

    if (settings) this.settings = settings;

    const self = this;

    ipcRenderer.on(`plugin.${PLUGIN_NAME}.name`, (_event, data) => {
      if (data.ok) {
        // For some reason the below line does not rerender. As a result, we force it.
        self.settings.username = data.name;
        self.$forceUpdate();
      } else {
        bootbox.alert(`${app.getLz("term.requestError")}: ${data.error}`);
      }
    });
  }
});

class ListenbrainzFrontend {
  constructor() {
    const menuEntry = new CiderFrontAPI.Objects.MenuEntry();
    menuEntry.id = window.uuidv4();
    menuEntry.name = "ListenBrainz Configuration"
    menuEntry.onClick = () => {
      app.appRoute("plugin/listenbrainz");
    };

    CiderFrontAPI.AddMenuEntry(menuEntry);

    ipcRenderer.invoke(`plugin.${PLUGIN_NAME}.setting`, getLocalStorage());

    ipcRenderer.once(`plugin.${PLUGIN_NAME}.name`, (_event, data) => {
      if (data.ok) {
        username = data.name;
      }
    })
  }
}

const ListenbrainzPlugin = new ListenbrainzFrontend();
