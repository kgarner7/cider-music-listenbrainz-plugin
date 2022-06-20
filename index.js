const { join } = require("path");

const { ipcMain } = require("electron");

const MAX_FRACTION_BEFORE_SCROBBLING = 0.8;
const PLUGIN_NAME = "listenbrainz";

module.exports = class CiderListenbrainzBackend {
  constructor(env) {
    this._env = env;
    this._store = env.utils.getStore();

    this._settings = {};

    this._cachedNowPlayingId = undefined;
    this._cachedId = undefined;

    this._timer = undefined;

    this._id = undefined;
    this._listenStartSec = undefined;
    this._payload = {};
    this._scrobbled = false;
    this._startTime = 0;
    this._timeElapsedMs = 0;
  }

  onReady(_win) {
    const { net } = require("electron");
    this._net = net;

    // Handle Pause/Play Events. We want to keep track of the total time elapsed
    ipcMain.on("playbackStateDidChange", (_event, data) => {
      if (!this._store.general.privateEnabled && this._settings.enabled && data.artistName) {
        if (data.status) {
          this._startTime = data.startTime;
          this.scrobbleSong();
        } else {
          if (this._timer) clearTimeout(this._timer);
          this._timeElapsedMs += data.startTime - this._startTime;
        }
      }
    });

    // Handle new tracks. Uses the Last.FM event, because the data is localized.
    ipcMain.on("nowPlayingItemDidChangeLastFM", (_event, data) => {
      if (!this._store.general.privateEnabled && this._settings.enabled && data.artistName) {
        // Save the ID; this will be used for later checks
        this._id = data.playParams.id;
        // ListenBrainz expects the start time in seconds
        this._listenStartSec = Math.floor(data.startTime / 1000);

        // This forms the core of a payload for ListenBrainz
        // https://listenbrainz.readthedocs.io/en/latest/users/json.htm
        this._payload = {
          track_metadata: {
            additional_info: {
              duration_ms: data.durationInMillis,
              isrc: data.isrc,
              music_service: "music.apple.com",
              origin_url: data.url.appleMusic,
              tracknumber: data.trackNumber
            },
            artist_name: data.artistName,
            release_name: data.albumName.replace(/ - Single| - EP/g, ''),
            track_name: data.name
          }
        };

        this._scrobbled = false;
        // Reset custom variables to keep track of timing
        this._startTime = data.startTime;
        this._timeElapsedMs = 0;

        // Adapted from LastFM plugin; if we do not filter loop, clear prior
        // IDs. Otherwise, they are preserved (which can detect duplicate tracks)
        if (!this._store.lastfm.filterLoop) {
          this._cachedId = undefined;
          this._cachedNowPlayingId = undefined;
        }

        if (this._settings.nowPlaying) {
          this.updateNowPlayingSong();
        }

        this.scrobbleSong();
      }
    });

    // Handle setting changes from the frontend.
    ipcMain.handle(`plugin.${PLUGIN_NAME}.setting`, (_event, settings) => {
      if (!settings) return;

      if (settings.delay) {
        settings.delay = parseInt(settings.delay, 10);
      }

      // If the token changed, try to validate it.
      const changed = this._settings.token !== settings.token;
      this._settings = settings;

      if (changed && this._settings.token) {
        // https://listenbrainz.readthedocs.io/en/latest/users/api/core.html (validate-token API)
        this._submitRequest(undefined, (data) => {
          const message = data.valid ? {
            ok: true, name: data.user_name
          } : {
            ok: false, error: data.message
          };

          this._env.utils.getWindow().webContents.send(`plugin.${PLUGIN_NAME}.name`, message);
        }, (error) => {
          this._env.utils.getWindow().webContents.send(`plugin.${PLUGIN_NAME}.name`, {
            ok: false,
            error: error
          });
        }, "/1/validate-token", "GET");
      }
    });
  }

  onRendererReady(_win) {
    this._env.utils.loadJSFrontend(join(this._env.dir, "index.frontend.js"))
  }

  updateNowPlayingSong() {
    if (!this._net || this._cachedNowPlayingId === this._id) return;

    const self = this;
    const submission = {
      listen_type: "playing_now", payload: [this._payload]
    };

    this._submitRequest(submission, () => {
      self._cachedNowPlayingId = this._id;
    }, (error) => {
      console.error(error);
    });
  }

  scrobbleSong() {
    if (this._timer) clearTimeout(this._timer);

    const self = this;

    // Calculate the amount of time to wait in a song
    const timeToWaitMs = Math.round(
      this._payload.track_metadata.additional_info.duration_ms *
      Math.min((self._settings.delay / 100), MAX_FRACTION_BEFORE_SCROBBLING)
    );

    // The amount of time left is the time to wait minus the elapsed time
    const remainingTime = timeToWaitMs - this._timeElapsedMs;

    // If somehow the time is negative, but we haven't scrobbled, trigger a scrobble.
    if (remainingTime < 0 && !this._scrobbled) {
      remainingTime = 0;
    }

    // Set a timer for the remaining time.
    if (remainingTime >= 0) {
      this._timer = setTimeout(() => {
        if (!self._net || self._cachedId === this._id) return;

        this._scrobbled = true;

        const submission = {
          listen_type: "single", payload: [{
            listened_at: this._listenStartSec, ...this._payload
          }]
        };

        this._submitRequest(submission, (_data) => {
          self._cachedId = this._id;
        }, (error) => {
          console.error(error)
        });
      }, remainingTime);
    }
  }

  _submitRequest(submission, onOk, onError, endPoint = "/1/submit-listens", method = "POST") {
    const request = this._net.request({
      method: method,
      protocol: "https:",
      host: "api.listenbrainz.org",
      path: endPoint
    });

    request.on("response", (response) => {
      response.on("data", (chunk) => {
        const respJson = JSON.parse(chunk.toString("utf-8"));

        // A response is only OK if it has HTTP code 200.
        if (response.statusCode === 200) {
          onOk(respJson);
        } else {
          onError(respJson.error);
        }
      });
    });

    request.on("error", onError);
    request.setHeader("Authorization", `Token ${this._settings.token}`);

    // If we have a JSON body (e.g., not validate-token), send that
    if (submission) {
      request.setHeader("Content-Type", "application/json");
      request.write(JSON.stringify(submission), "utf-8");
    }

    request.end();
  }
}
