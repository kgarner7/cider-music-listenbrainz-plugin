import { join } from "path";

import { ipcMain } from "electron";

import type { AuthResponse, Settings } from "./types";

const pkg = require("./package.json");

const MAX_FRACTION_BEFORE_SCROBBLING = 0.8;
const PLUGIN_NAME = "listenbrainz";

const USER_AGENT = `${pkg.name}/${pkg.version} { ${pkg.repository.url} }`

interface Payload {
  track_metadata: {
    additional_info: {
      artist_mbids?: string[];
      duration_ms: number;
      isrc?: string;
      music_service?: "music.apple.com";
      origin_url?: string;
      recording_mbid?: string;
      tracknumber?: number;
    };
    artist_name: string;
    release_name?: string;
    track_name: string;
  }
}

interface NowPlayingSubmission {
  listen_type: "playing_now";
  payload: [Payload];
}

interface PayloadForSubmission extends Payload {
  listened_at: number;
}

interface SingleSubmission {
  listen_type: "single";
  payload: [PayloadForSubmission];
}

type Submission = NowPlayingSubmission | SingleSubmission;

interface NetError {
  error: Error;
  net: true;
}

interface HTTPError {
  code: number;
  net: false;
  msg: string;
}

type RequestError = NetError | HTTPError;

async function sleep(timeout_ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => resolve, timeout_ms);
  })
}

function logError(error: RequestError): void {
  if (!error.net) {
    console.error("[Plugin][ListenBrainz]: %s (status code %d)", error.msg, error.code);
  } else {
    console.error("[Plugin][ListenBrainz]: ", error.error);
  }
}

// Adapted heavily from https://github.com/ciderapp/Cider/blob/dfd3fe6271f8328e3530bc7bc89d60c2f9536b87/src/main/plugins/lastfm.ts
// In particular, getPrimaryArtist is virtually the same
export default class CiderListenbrainzBackend {
  private env: any;
  private store: Record<string, any>;
  private net?: Electron.Net;

  private settings: Settings = {
    debug: false,
    delay: 50,
    enabled: false,
    filterLoop: false,
    nowPlaying: false,
    removeFeatured: false,
    token: undefined,
    username: undefined
  };

  private cachedNowPlayingId?: string;
  private cachedId?: string;

  private timer?: NodeJS.Timeout;

  private id?: string;
  private payload?: Payload;
  private scrobbled = false;
  private startTime = 0;
  private timeElapsedMs = 0;

  constructor(env: any) {
    this.env = env;
    this.store = env.utils.getStore();
  }

  public onReady(_win: any): void {
    const { net } = require("electron");
    this.net = net;

    // Handle Pause/Play Events. We want to keep track of the total time elapsed
    try {
      ipcMain.on("playbackStateDidChange", (_event, data) => {
        if (
          !this.store.general.privateEnabled &&
          this.settings.enabled &&
          this.payload?.track_metadata &&
          data.artistName
        ) {
          if (data.status) {
            this.startTime = data.startTime;
            this.scrobbleSong();
          } else {
            if (this.timer) {
              clearTimeout(this.timer);
              this.timer = undefined;
            }
            this.timeElapsedMs += data.startTime - this.startTime;
          }
        }
      });

      // Handle new tracks
      ipcMain.on("nowPlayingItemDidChange", async (_event, data) => {
        if (!this.store.general.privateEnabled && this.settings.enabled && data.artistName) {
          // Save the ID; this will be used for later checks
          this.id = data.playParams.catalogId || data.playParams.id;

          // This is available for Apple Music tracks
          if (data.isrc) {
            // Upper-case, because apparently it's sometimes not all uppercase
            const isrc = data.isrc.substring(data.isrc.length - 12).toLocaleUpperCase();

            try {
              // Attempt to lookup by ISRC first
              this.payload = await this.lookupIsrc(isrc, data.url.appleMusic);

              if (!this.payload && this.settings.debug) {
                console.info("[Plugin][ListenBrainz][%s][%s]: ISRC not found", isrc, data.name);
              }
            } catch (error) {
              if (this.settings.debug) {
                console.error("[Plugin][ListenBrainz][%s][%s]", isrc, data.name, error);
              }

              this.payload = undefined;
            }

            if (!this.payload) {
              const album = data.albumName.replace(/ - Single| - EP/g, '')
              const artist = await this.getPrimaryArtist(data.artistName);

              // This forms the core of a payload for ListenBrainz
              // https://listenbrainz.readthedocs.io/en/latest/users/json.htm
              this.payload = {
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

              this.payload = {
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
              this.payload = undefined;

              if (this.timer) {
                clearTimeout(this.timer);
                this.timer = undefined;
              }
              return;
            }
          }

          this.scrobbled = false;
          // Reset custom variables to keep track of timing
          this.startTime = data.startTime;
          this.timeElapsedMs = 0;

          // Adapted from LastFM plugin; if we do not filter loop, clear prior
          // IDs. Otherwise, they are preserved (which can detect duplicate tracks)
          if (!this.settings.filterLoop) {
            this.cachedId = undefined;
            this.cachedNowPlayingId = undefined;
          }

          if (this.settings.nowPlaying) {
            await this.updateNowPlayingSong();
          }

          this.scrobbleSong();
        }
      });

      // Handle setting changes from the frontend.
      ipcMain.handle(`plugin.${PLUGIN_NAME}.setting`, async (_event, settings?: Settings) => {
        if (!settings) return;

        if (settings.delay) {
          settings.delay = settings.delay;
        }

        // If the token changed, try to validate it.
        const changed = this.settings.token !== settings.token;
        this.settings = settings;

        if (changed && this.settings.token) {
          // https://listenbrainz.readthedocs.io/en/latest/users/api/core.html (validate-token API)

          try {
            const data = await this.submitRequest(undefined, "/1/validate-token", "GET");

            const message: AuthResponse = data.valid ? {
              ok: true, name: data.user_name
            } : {
              ok: false, error: data.message
            };

            this.env.utils.getWindow().webContents.send(`plugin.${PLUGIN_NAME}.name`, message);
          } catch (error) {
            this.env.utils.getWindow().webContents.send(`plugin.${PLUGIN_NAME}.name`, {
              ok: false,
              error: error
            });
          }
        }
      });
    } catch (_ignored) {
      // An error should only fire if we attempt to handle a second time.
      // This seems to happen if you are prompted to log in and then press continue. In this case,
      // we should ignore the error
    }

    console.info("[Plugin][ListenBrainz]: Ready");
  }

  public onRendererReady(_win: any): void {
    this.env.utils.loadJSFrontend(join(this.env.dir, "index.frontend.js"));
    console.info("[Plugin][ListenBrainz]: Renderer Ready");
  }

  public async updateNowPlayingSong(): Promise<void> {
    if (!this.net || this.cachedNowPlayingId === this.id || !this.payload) return;

    const submission: Submission = {
      listen_type: "playing_now", payload: [this.payload]
    };

    try {
      await this.submitRequest(submission);
      this.cachedNowPlayingId = this.id;
    } catch (error) {
      logError(error as RequestError);
    }
  }

  public scrobbleSong(): void {
    if (this.timer) clearTimeout(this.timer);
    if (!this.payload) return;

    const self = this;
    const payload = this.payload;

    // Calculate the amount of time to wait in a song
    const timeToWaitMs = Math.round(
      this.payload.track_metadata.additional_info.duration_ms *
      Math.min((self.settings.delay / 100), MAX_FRACTION_BEFORE_SCROBBLING)
    );

    // The amount of time left is the time to wait minus the elapsed time
    let remainingTime = timeToWaitMs - this.timeElapsedMs;

    // If somehow the time is negative, but we haven't scrobbled, trigger a scrobble.
    if (remainingTime < 0 && !this.scrobbled) {
      remainingTime = 0;
    }

    // Set a timer for the remaining time.
    if (remainingTime >= 0) {
      self.timer = setTimeout(async () => {
        self.timer = undefined;
        if (!self.net || self.cachedId === this.id) return;

        self.scrobbled = true;

        const submission: Submission = {
          listen_type: "single", payload: [{
            listened_at: Math.floor(new Date().getTime() / 1000), ...payload
          }]
        };

        for (let tries = 1; tries <= 5; tries++) {
          try {
            await self.submitRequest(submission);
            self.cachedId = self.id;
          } catch (error) {
            let err = error as RequestError;
            logError(err as RequestError);

            if (err.net || err.code !== 503) {
              break;
            }

            // Sleep for 10 seconds * how many tries we've made
            await sleep(10_000 * tries);
          }
        }
      }, remainingTime);
    }
  }

  private async submitRequest(submission: Submission | undefined,
    endPoint = "/1/submit-listens",
    method = "POST"
  ): Promise<any> {
    return new Promise((resolve: (value: any) => void, reject: (value: RequestError) => void) => {
      const request = this.net!.request({
        method: method,
        protocol: "https:",
        host: "api.listenbrainz.org",
        path: endPoint
      });

      request.setHeader("Authorization", `Token ${this.settings.token}`);
      request.setHeader("User-Agent", USER_AGENT);

      request.on("response", (response) => {
        let body = "";

        response.on("end", () => {
          try {
            const respJson = JSON.parse(body);

            // A response is only OK if it has HTTP code 200.
            if (response.statusCode === 200) {
              resolve(respJson);
            } else {
              reject({ code: response.statusCode, net: false, msg: respJson.error, });
            }
          } catch (error) {
            reject({ error: error as Error, net: true });
          }
        });

        response.on("data", chunk => {
          body += chunk.toString("utf-8");
        });
      });

      request.on("error", error => {
        reject({ error, net: true });
      });

      // If we have a JSON body (e.g., not validate-token), send that
      if (submission) {
        request.setHeader("Content-Type", "application/json");
        request.write(JSON.stringify(submission), "utf-8");
      }

      request.end();
    })
  }

  private async lookupIsrc(isrc: string, url: string): Promise<Payload | undefined> {
    return new Promise((resolve, reject) => {
      try {
        const request = this.net!.request(`https://musicbrainz.org/ws/2/recording?query=isrc:${isrc}&fmt=json`);
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
                  resolve(undefined);
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

  private async getPrimaryArtist(originalName: string): Promise<string> {
    if (!this.settings.removeFeatured || !this.id) return originalName;

    const res = await this.env.utils.getWindow().webContents.executeJavaScript(`
        (async () => {
            const subMk = await MusicKit.getInstance().api.v3.music("/v1/catalog/" + MusicKit.getInstance().storefrontId + "/songs/${this.id}", {
                include: {
                    songs: ["artists"]
                }
            });
            if (!subMk) console.error('[Plugin][ListenBrainz]: Request failed: /v1/catalog/us/songs/${this.id}');
            return subMk.data;
        })()
    `).catch((error: any) => {
      console.error("[Plugin][ListenBrainz]: ", error);
    });
    if (!res) return originalName;

    const data = res.data;
    if (!data.length) {
      console.error(`[Plugin][ListenBrainz]: Unable to locate song with id of ${this.id}`)
      return originalName;
    }

    const artists = res.data[0].relationships.artists.data;
    if (!artists.length) {
      console.error(`[Plugin][ListenBrainz]: Unable to find artists related to the song with id of ${this.id}`)
      return originalName;
    }

    const primaryArtist = artists[0];

    // Contrary to the LastFM plugin, it appears that the name might not be included in
    // the attributes. In this case, try to fetch the artist manually
    if (primaryArtist.attributes && primaryArtist.attributes.name) {
      return primaryArtist.attributes.name;
    } else {
      const artistRes = await this.env.utils.getWindow().webContents.executeJavaScript(`
        (async () => {
            const subMk = await MusicKit.getInstance().api.v3.music("${primaryArtist.href}", {});
            if (!subMk) console.error('[Plugin][ListenBrainz]: Request failed: ${primaryArtist.href}');
            return subMk.data;
        })()
      `).catch((error: any) => {
        console.error("[Plugin][ListenBrainz]:", error);
      });

      if (!artistRes) return originalName;
      return artistRes.data[0].attributes.name;
    }
  }
}
