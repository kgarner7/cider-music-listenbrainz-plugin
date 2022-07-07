const { join } = require("path");

const { ipcMain } = require("electron");

const package = require("./package.json");

const MAX_FRACTION_BEFORE_SCROBBLING = 0.8;
const PLUGIN_NAME = "listenbrainz";

const USER_AGENT = `${package.name}/${package.version} { ${package.repository.url} }`

// Adapted heavily from https://github.com/ciderapp/Cider/blob/dfd3fe6271f8328e3530bc7bc89d60c2f9536b87/src/main/plugins/lastfm.ts
// In particular, getPrimaryArtist is virtually the same
module.exports = class CiderListenbrainzBackend {
  constructor(env) {
    this._env = env;
    this._store = env.utils.getStore();

    this._settings = {};

    this._cachedNowPlayingId = undefined;
    this._cachedId = undefined;

    this._timer = undefined;

    this._id = undefined;
    this._payload = {};
    this._scrobbled = false;
    this._startTime = 0;
    this._timeElapsedMs = 0;
  }

  onReady(_win) {
    const { net } = require("electron");
    this._net = net;

    // Handle Pause/Play Events. We want to keep track of the total time elapsed
    try {
      ipcMain.on("playbackStateDidChange", (_event, data) => {
        if (
          !this._store.general.privateEnabled &&
          this._settings.enabled &&
          this._payload.track_metadata &&
          data.artistName
        ) {
          if (data.status) {
            this._startTime = data.startTime;
            this.scrobbleSong();
          } else {
            if (this._timer) {
              clearTimeout(this._timer);
              this._timer = undefined;
            }
            this._timeElapsedMs += data.startTime - this._startTime;
          }
        }
      });

      // Handle new tracks
      ipcMain.on("nowPlayingItemDidChange", async (_event, data) => {
        if (!this._store.general.privateEnabled && this._settings.enabled && data.artistName) {
          // Save the ID; this will be used for later checks
          this._id = data.playParams.catalogId || data.playParams.id;

          // This is available for Apple Music tracks
          if (data.isrc) {
            // Upper-case, because apparently it's sometimes not all uppercase
            const isrc = data.isrc.substring(data.isrc.length - 12).toLocaleUpperCase();

            try {
              // Attempt to lookup by ISRC first
              this._payload = await this._lookupIsrc(isrc, data.url.appleMusic);

              if (this._payload === null && this._settings.debug) {
                console.info("[Plugin][ListenBrainz][%s][%s]: ISRC not found", isrc, data.name);
              }
            } catch (error) {
              if (this._settings.debug) {
                console.error("[Plugin][ListenBrainz][%s][%s]", isrc, data.name, error);
              }

              this._payload = null;
            }

            if (this._payload === null) {
              const album = data.albumName.replace(/ - Single| - EP/g, '')
              const artist = await this._getPrimaryArtist(data.artistName);

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
                  artist_name: artist,
                  release_name: album,
                  track_name: data.name
                }
              };
            }


          } else {
            // Local files have reduced metadata (and are currently given an id starting with ciderlocal)
            if (data.playParams.id.startsWith("ciderlocal")) {
              const album = data.albumName.replace(/ - Single| - EP/g, '');

              this._payload = {
                track_metadata: {
                  additional_info: {
                    duration_ms: data.durationInMillis,
                    music_service: "music.apple.com",
                    tracknumber: data.trackNumber
                  },
                  artist_name: data.albumName,
                  release_name: album,
                  track_name: data.name
                }
              };
            } else {
              // Otherwise, it's probably a podcast. This is unsupported
              this._payload = {};

              if (this._timer) {
                clearTimeout(this._timer);
                this._timer = undefined;
              }
              return;
            }
          }

          this._scrobbled = false;
          // Reset custom variables to keep track of timing
          this._startTime = data.startTime;
          this._timeElapsedMs = 0;

          // Adapted from LastFM plugin; if we do not filter loop, clear prior
          // IDs. Otherwise, they are preserved (which can detect duplicate tracks)
          if (!this._settings.filterLoop) {
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
    } catch (_ignored) {
      // An error should only fire if we attempt to handle a second time.
      // This seems to happen if you are prompted to log in and then press continue. In this case,
      // we should ignore the error
    }

    console.info("[Plugin][ListenBrainz]: Ready");
  }

  onRendererReady(_win) {
    this._env.utils.loadJSFrontend(join(this._env.dir, "index.frontend.js"));
    console.info("[Plugin][ListenBrainz]: Renderer Ready");

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
      console.error("[Plugin][ListenBrainz]: ", error);
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
        this._timer = undefined;
        if (!self._net || self._cachedId === this._id) return;

        this._scrobbled = true;

        const submission = {
          listen_type: "single", payload: [{
            listened_at: Math.floor(new Date().getTime() / 1000), ...this._payload
          }]
        };

        this._submitRequest(submission, (_data) => {
          self._cachedId = self._id;
        }, (error) => {
          self._cachedId = self._id;

          if (error.msg) {
            console.error("[Plugin][ListenBrainz]: %s (status code %d)", error.msg, error.code);

            if (error.code === 503) {
              self._scrobbleRecursive(submission);
            }
          } else {
            console.error("[Plugin][ListenBrainz]: ", error);
          }
        });
      }, remainingTime);
    }
  }

  _scrobbleRecursive(submission, depth = 1) {
    if (depth === 5) {
      console.error("[Plugin][ListenBrainz]: Attempted to scrobble 5 times, but the queue is full");
      return;
    }

    const self = this;

    setTimeout(() => {
      self._submitRequest(submission, (_resp) => {
        // Ok.
      }, (error) => {
        if (error.msg) {
          console.error("[Plugin][ListenBrainz]: %s (status code %d)", error.msg, error.code);

          if (error.code === 503) {
            self._scrobbleRecursive(submission, depth + 1);
          }
        } else {
          console.error("[Plugin][ListenBrainz]: ", error);
        }
      })
    }, depth * 10_000)
  }

  _submitRequest(submission, onOk, onError, endPoint = "/1/submit-listens", method = "POST") {
    const request = this._net.request({
      method: method,
      protocol: "https:",
      host: "api.listenbrainz.org",
      path: endPoint
    });

    request.setHeader("Authorization", `Token ${this._settings.token}`);
    request.setHeader("User-Agent", USER_AGENT);

    request.on("response", (response) => {
      response.on("data", (chunk) => {
        const respJson = JSON.parse(chunk.toString("utf-8"));

        // A response is only OK if it has HTTP code 200.
        if (response.statusCode === 200) {
          onOk(respJson);
        } else {
          onError({ msg: respJson.error, code: response.statusCode });
        }
      });
    });

    request.on("error", onError);

    // If we have a JSON body (e.g., not validate-token), send that
    if (submission) {
      request.setHeader("Content-Type", "application/json");
      request.write(JSON.stringify(submission), "utf-8");
    }

    request.end();
  }

  async _lookupIsrc(isrc, url) {
    return new Promise((resolve, reject) => {
      try {
        const request = this._net.request(`https://musicbrainz.org/ws/2/recording?query=isrc:${isrc}&fmt=json`);
        request.setHeader("User-Agent", USER_AGENT);

        request.on("response", response => {
          let body = "";

          response.on("end", () => {
            try {
              const json = JSON.parse(body);

              if (json.error) {
                reject(json.error);
              } else {
                if (json.count === 1) {
                  const recording = json.recordings[0];

                  let artistNames = "";
                  const artists = [];

                  for (const artist of recording["artist-credit"]) {
                    artistNames += artist.name + (artist.joinphrase || "");
                    artists.push(artist["artist"].id);
                  }

                  resolve({
                    track_metadata: {
                      additional_info: {
                        artist_mbids: artists,
                        duration_ms: recording.length,
                        isrc: isrc,
                        music_service: "music.apple.com",
                        origin_url: url,
                        recording_mbid: recording.id,
                      },
                      artist_name: artistNames,
                      track_name: recording.title
                    }
                  })
                } else {
                  resolve(null);
                }
              }
            } catch (error) {
              // We should never get here, but just in case.....
              reject(error);
            }
          });

          // We may have multiple data chunks
          response.on("data", chunk => {
            body += chunk.toString("utf-8");
          });
        })

        request.on("error", reject);
        request.end();
      } catch (error) {
        // We should never get here...
        reject(error);
      }
    });
  }

  async _getPrimaryArtist(originalName) {
    if (!this._settings.removeFeatured || !this._id) return originalName;

    const res = await this._env.utils.getWindow().webContents.executeJavaScript(`
        (async () => {
            const subMk = await MusicKit.getInstance().api.v3.music("/v1/catalog/" + MusicKit.getInstance().storefrontId + "/songs/${this._id}", {
                include: {
                    songs: ["artists"]
                }
            });
            if (!subMk) console.error('[Plugin][ListenBrainz]: Request failed: /v1/catalog/us/songs/${this._id}');
            return subMk.data;
        })()
    `).catch(error => {
      console.error("[Plugin][ListenBrainz]: ", error);
    });
    if (!res) return originalName;

    const data = res.data;
    if (!data.length) {
      console.error(`[Plugin][ListenBrainz]: Unable to locate song with id of ${this._id}`)
      return originalName;
    }

    const artists = res.data[0].relationships.artists.data;
    if (!artists.length) {
      console.error(`[Plugin][ListenBrainz]: Unable to find artists related to the song with id of ${this._id}`)
      return originalName;
    }

    const primaryArtist = artists[0];

    // Contrary to the LastFM plugin, it appears that the name might not be included in
    // the attributes. In this case, try to fetch the artist manually
    if (primaryArtist.attributes && primaryArtist.attributes.name) {
      return primaryArtist.attributes.name;
    } else {
      const artistRes = await this._env.utils.getWindow().webContents.executeJavaScript(`
        (async () => {
            const subMk = await MusicKit.getInstance().api.v3.music("${primaryArtist.href}", {});
            if (!subMk) console.error('[Plugin][ListenBrainz]: Request failed: ${primaryArtist.href}');
            return subMk.data;
        })()
      `).catch(error => {
        console.error("[Plugin][ListenBrainz]:", error);
      });

      if (!artistRes) return originalName;
      return artistRes.data[0].attributes.name;
    }
  }
}
