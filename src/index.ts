import { join } from "path";

import { ipcMain } from "electron";

import type { Provider } from "./types";

import { ListenBrainzProvider } from "./providers/listenbrainz";
import { PLUGIN_NAME, StorageType } from "./consts";
import { BaseProvider } from "./providers/baseProvider";
import { Payload } from "./providers/types";
import { LibreFMProvider } from "./providers/librefm";
import pkg, { USER_AGENT } from "./consts-backend";
import type { GeneralData } from "./components/util";

const MAX_FRACTION_BEFORE_SCROBBLING = 0.9;

// Adapted heavily from https://github.com/ciderapp/Cider/blob/dfd3fe6271f8328e3530bc7bc89d60c2f9536b87/src/main/plugins/lastfm.ts
// In particular, getPrimaryArtist is virtually the same
export default class CiderListenbrainzBackend {
  public name = pkg.description;
  public version = pkg.version;
  public author = pkg.author;

  private env: any;
  private store: Record<string, any>;
  private net?: Electron.Net;

  private providers!: {
    [key in Provider]: BaseProvider
  };

  private settings: GeneralData = {
    debug: false,
    delay: 50,
    filterLoop: false,
    nowPlaying: false
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

    this.providers = {
      librefm: new LibreFMProvider(),
      listenbrainz: new ListenBrainzProvider(StorageType.listenbrainz),
      maloja: new ListenBrainzProvider(StorageType.maloja)
    };

    BaseProvider.init(this.env, this.net);

    // Handle Pause/Play Events. We want to keep track of the total time elapsed
    try {
      ipcMain.on("playbackStateDidChange", (_event, data) => {
        if (
          !this.store.general.privateEnabled &&
          this.enabled() &&
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
        if (!this.store.general.privateEnabled && this.enabled() && data.artistName) {
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
                console.info("[Plugin][%s][%s][%s]: ISRC not found", PLUGIN_NAME, isrc, data.name);
              }
            } catch (error) {
              if (this.settings.debug) {
                console.error("[Plugin][%s][%s][%s]", PLUGIN_NAME, isrc, data.name, error);
              }

              this.payload = undefined;
            }

            if (!this.payload) {
              const album = data.albumName.replace(/ - Single| - EP/g, '')

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
                  artist_name: data.artistName,
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
            this.updateNowPlayingSong();
          }

          this.scrobbleSong();
        }
      });

      ipcMain.handle(`plugin.${PLUGIN_NAME}.${StorageType.general}`, (_event, settings: GeneralData) => {
        this.settings = settings;
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

  private enabled(): boolean {
    for (const provider of Object.values(this.providers)) {
      if (provider.enabled()) {
        return true;
      }
    }

    return false;
  }

  private updateNowPlayingSong(): void {
    if (!this.net || this.cachedNowPlayingId === this.id || !this.payload) return;

    const payload = this.payload;

    for (const provider of Object.values(this.providers)) {
      if (provider.enabled()) {
        provider.updateListening(payload);
      }
    }
  }

  private scrobbleSong(): void {
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
    } else if (this.scrobbled) {
      remainingTime = -1;
    }

    // Set a timer for the remaining time.
    if (remainingTime >= 0) {
      self.timer = setTimeout(() => {
        self.timer = undefined;
        if (!self.net || self.cachedId === this.id) return;

        self.scrobbled = true;

        const scrobbleTime = new Date();

        for (const provider of Object.values(self.providers)) {
          if (provider.enabled()) {
            provider.scrobbleSong(payload, scrobbleTime);
          }
        }
      }, remainingTime);
    }
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
}
