const { join } = require("path");

const { ipcMain } = require("electron");

const PLUGIN_NAME = "listenbrainz";

module.exports = class CiderListenbrainzBackend {
  constructor(env) {
    this._env = env;

    this._store = env.utils.getStore();

    this._cachedNowPlayingId = undefined;
    this._cachedId = undefined;
    this._timer = undefined;

    this._settings = {};
  }

  onReady(win) {
    const { net } = require("electron");
    this._net = net;

    ipcMain.on("nowPlayingItemDidChangeLastFM", (_event, data) => {
      if (!this._store.general.privateEnabled && this._settings.enabled && data.artistName) {
        const listened_at = Math.floor(data.startTime / 1000);
        const id = data.playParams.id;

        const payload = {
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


        if (!this._store.lastfm.filterLoop) {
          this._cachedId = undefined;
          this._cachedNowPlayingId = undefined;
        }


        if (this._settings.nowPlaying) {
          this.updateNowPlayingSong(payload, id);
        }

        this.scrobbleSong(payload, id, listened_at);
      }
    });

    ipcMain.handle(`plugin.${PLUGIN_NAME}.setting`, (event, settings) => {
      if (!settings) return;

      if (settings.delay) {
        settings.delay = parseInt(settings.delay, 10);
      }

      const changed = this._settings.token !== settings.token;
      this._settings = settings;


      if (changed && this._settings.token) {
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

  onRendererReady(win) {
    this._env.utils.loadJSFrontend(join(this._env.dir, "index.frontend.js"))
  }

  updateNowPlayingSong(payload, id) {
    if (!this._net || this._cachedNowPlayingId === id) {
      return;
    }

    const self = this;

    const submission = {
      listen_type: "playing_now", payload: [payload]
    };

    this._submitRequest(submission, () => {
      self._cachedNowPlayingId = id;
    }, (error) => {
      console.error(error);
    });
  }

  scrobbleSong(payload, id, listened_at) {
    if (this._timer) clearTimeout(this._timer);

    const self = this;

    this._timer = setTimeout(async () => {
      if (!self._net || self._cachedId === id) {
        return
      }

      // Needed for listens.
      payload.listened_at = listened_at;

      const submission = {
        listen_type: "single", payload: [payload]
      };

      this._submitRequest(submission, () => {
        self._cachedId = id;
      }, (error) => {
        console.error(error)
      });
    }, Math.round(
      payload.track_metadata.additional_info.duration_ms *
      Math.min((self._settings.delay / 100), 0.8)
    ));
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

        if (response.statusCode === 200) {
          onOk(respJson);
        } else {
          onError(respJson.error);
        }
      });
    });

    request.on("error", onError);
    request.setHeader("Authorization", `Token ${this._settings.token}`);

    if (submission) {
      request.setHeader("Content-Type", "application/json");
      request.write(JSON.stringify(submission), "utf-8");
    }

    request.end();
  }
}
