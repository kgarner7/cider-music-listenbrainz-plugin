import Vue from "vue";
import { PLUGIN_NAME } from "../consts";
import { USER_AGENT } from "../consts-backend";
import debounce from "../debounce";
import RecItem, { MatchedRecommendation } from "./recItem";
import { StorageUtil } from "./util";


const enum RecommendationType {
  raw = "raw",
  similar = "similar",
  top = "top"
}

const enum Matched {
  any = "any",
  only = "only",
  not = "not"
}

interface Recommendation {
  latest_listened_at: string | null;
  recording_mbid: string;
  score: number;
}


interface Payload {
  payload: {
    count: number;
    entity: "recording";
    last_updated: number;
    mbids: Recommendation[];
    offset: 0;
    total_mbid_count: number;
  }
}

interface Recording {
  title: string;
  length: number;
  releases: Release[];
  isrcs: string[];
  "artist-credit": ArtistCredit[];

  firstReleaseDate: string;
}

interface Release {
  country?: string | null;
  disambiguation?: string | null;
  id: string;
  title: string;
}

interface ArtistCredit {
  artist: {
    disambiguation: string;
    id: string;
    name: string;
  };
  name: string;
  joinphrase: string;
}

interface RecommendationPersistent {
  [RecommendationType.raw]: Record<string, MatchedRecommendation>;
  [RecommendationType.similar]: Record<string, MatchedRecommendation>;
  [RecommendationType.top]: Record<string, MatchedRecommendation>;
  background: boolean;
  fetch: number;
  page: {
    [RecommendationType.raw]: number;
    [RecommendationType.similar]: number;
    [RecommendationType.top]: number;
  };
  perPage: number;
  matched: Matched;
  type: RecommendationType
}

interface RecommendationData {
  app: any;
  count: number | null;
  outOf: number | null;
  persist: RecommendationPersistent;
  query: string | null;
}

let killed = false;

// trick the compiler into thinking it is used
RecItem.version;

export default Vue.component(`plugin-${PLUGIN_NAME}-recommendation`, {
  template: `
  <b-tab>
    <template #title>
      <div>Recommendations</div>
    </template>
    <div class="library-page">
      <div class="library-header">
        <div class="row">
          <div class="col">
            <div class="search-input-container" style="width:100%;margin: 16px 0;">
              <div class="search-input--icon"></div>
              <input type="search"
                style="width:100%;"
                spellcheck="false"
                :placeholder="app.getLz('term.search') + '...'"
                class="search-input"
                v-model="query"
              >
            </div>
          </div>
          <div class="col-auto flex-center">
            <select class="md-select" v-model="persist.type">
              <optgroup label="Recommendation type">
                <option value="${RecommendationType.raw}">Raw</option>
                <option value="${RecommendationType.top}">Top artists</option>
                <option value="${RecommendationType.similar}">Similar artists</option>
              </optgroup>
            </select>
          </div>
          <div class="col-auto flex-center">
            <select class="md-select" v-model.number="persist.fetch">
              <optgroup label="Recommendations to store: ">
                <option value="25">Top 25</option>
                <option value="50">Top 50</option>
                <option value="100">Top 100</option>
                <option value="250">Top 250</option>
                <option value="-1">All</option>
              </optgroup>
            </select>
          </div>
          <div class="col-auto flex-center">
            <select class="md-select" v-model.number="persist.perPage">
              <optgroup label="Recommendations per page">
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
                <option value="250">250 / page</option>
              </optgroup>
            </select>
          </div>
          <div class="col-auto flex-center">
            <select class="md-select" v-model="persist.matched">
              <optgroup label="Songs to show">
                <option value="${Matched.any}">All</option>
                <option value="${Matched.only}">Matched songs</option>
                <option value="${Matched.not}">Unmatched songs</option>
              </optgroup>
            </select>
          </div>
          <div class="col-auto flex-center">
            <button
              v-if="count === null"
              @click="fetchRecommendations()"
              class="reload-btn"
              :aria-label="app.getLz('menubar.options.reload')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512"><!-- Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d="M500.33 0h-47.41a12 12 0 0 0-12 12.57l4 82.76A247.42 247.42 0 0 0 256 8C119.34 8 7.9 119.53 8 256.19 8.1 393.07 119.1 504 256 504a247.1 247.1 0 0 0 166.18-63.91 12 12 0 0 0 .48-17.43l-34-34a12 12 0 0 0-16.38-.55A176 176 0 1 1 402.1 157.8l-101.53-4.87a12 12 0 0 0-12.57 12v47.41a12 12 0 0 0 12 12h200.33a12 12 0 0 0 12-12V12a12 12 0 0 0-12-12z"/></svg>
            </button>
            <template v-else>
              <button class="col md-btn md-btn-primary md-btn-icon" @click="kill()" style="margin-right: 15px">
                {{ app.getLz("dialog.cancel") }}
              </button>
              <button class="reload-btn" style="opacity: 0.8;pointer-events: none" :aria-label="app.getLz('menubar.options.reload')">
                <div class="spinner"></div>
              </button>
            </template>
          </div>
          <div class="col-auto flex-center" v-if="count !== null">
            {{ count }} / {{ outOf }}
          </div>
          <div class="col-auto flex-center">
            <button
              @click="nuke()"
              class="md-btn md-btn-primary"
              aria-label="Delete Recommendations"
              v-if="numPages > 0"
            >
              Delete Recommendations
            </button>
          </div>
        </div>
        <div class="row" style="margin-bottom: 16px">
          <button
            class="col md-btn page-btn"
            :disabled="currentPage === 1"
            @click="goToPage(1)"
          >
            <img class="md-ico-first"/>
          </button>
          <button
            class="col md-btn page-btn prev"
            :disabled="currentPage === 1"
            @click="goToPrevious()"
          >
            <img class="md-ico-prev"/>
          </button>
          <button
            :class="getPageClass(page)"
            @click="goToPage(page)"
            v-for="page in pagesToShow"
          >{{ page }}</button>
          <button
            class="col md-btn page-btn next"
            :disabled="currentPage === numPages"
            @click="goToNext()"
          >
            <img class="md-ico-next"/>
          </button>
          <button
            class="col md-btn page-btn last"
            :disabled="currentPage === numPages"
            @click="goToEnd()"
          >
            <img class="md-ico-last"/>
          </button>
          <div class="col page-btn" style="min-width: 12em;">
            <input type="number" min="1" :max="numPages" :value="currentPage" @change="changePage" />
            <span>/ {{ numPages || 1 }}</span>
          </div>
        </div>
      </div>
      <div class="well brainz-rec" v-if="numPages === 0">
        No recommendations yet. Try refreshing for some!
      </div>
      <div class="well brainz-rec" v-else>
        <template v-for="(item, index) in currentSlice">
          <plugin-${PLUGIN_NAME}-item :item="item" :cached="cached" @cache="cacheChange" />
        </template>
      </div>
    </div>
  </b-tab>
  `,
  props: {
    cached: { type: Object, required: true },
    username: { type: String, required: true },
  },
  data: function (): RecommendationData {
    let persist = StorageUtil.getStorage("recommendation", true) as RecommendationPersistent | null;

    if (!persist) {
      persist = {
        [RecommendationType.raw]: {},
        [RecommendationType.similar]: {},
        [RecommendationType.top]: {},
        background: false,
        fetch: 25,
        matched: Matched.any,
        page: {
          [RecommendationType.raw]: 1,
          [RecommendationType.similar]: 1,
          [RecommendationType.top]: 1,
        },
        perPage: 25,
        type: RecommendationType.raw
      };

      StorageUtil.setStorage("recommendation", persist, true);
    }

    return {
      app: this.$root, count: null, outOf: null, persist, query: null
    };
  },
  mounted() {
    this.update = debounce(this.update, 300) as VoidFunction;
    killed = true;
  },
  watch: {
    "persist.fetch": {
      handler(): void { this.update() }
    },
    "persist.matched": {
      handler(): void { this.update() }
    },
    "persist.type": {
      handler(): void { this.update() }
    },
    [`persist.page.${RecommendationType.raw}`]: {
      handler(): void {
        this.update()
      }
    },
    [`persist.page.${RecommendationType.similar}`]: {
      handler(): void { this.update() }
    },
    [`persist.page.${RecommendationType.top}`]: {
      handler(): void { this.update() }
    }
  },
  computed: {
    // Pagination
    currentPage(): number {
      return this.persist.page[this.persist.type] ?? 1;;
    },
    currentSlice(): MatchedRecommendation[] {
      const startingPage = Math.min(this.numPages, this.currentPage);
      const result = this.display.slice(
        (startingPage - 1) * this.persist.perPage,
        startingPage * this.persist.perPage
      );

      return result;
    },
    numPages(): number {
      return Math.ceil(this.display.length / this.persist.perPage);
    },
    pagesToShow(): number[] {
      let start = this.currentPage - 2;
      let end = this.currentPage + 2;

      if (start < 1) {
        end += (1 - start);
        start = 1;
      }

      const endDifference = end - this.numPages;
      if (endDifference > 0) {
        end = this.numPages;
        start = Math.max(1, start - endDifference);
      }

      const array = [];
      for (let idx = start; idx <= end; idx++) {
        array.push(idx);
      }
      return array;
    },
    // display
    display(): MatchedRecommendation[] {
      let data = Object.values(this.persist[this.persist.type]);

      if (this.query && this.persist.matched !== Matched.any) {
        const expectMatch = this.persist.matched === Matched.only;

        const query = this.query.toLocaleLowerCase();

        data = data.filter(item =>
          ((item.mk) !== null) === expectMatch &&
          (item.title.toLocaleLowerCase().includes(query) || item.by.toLocaleLowerCase().includes(query))
        );
      } else if (this.query) {
        const query = this.query.toLocaleLowerCase();

        data = data.filter(item =>
          (item.title.toLocaleLowerCase().includes(query) || item.by.toLocaleLowerCase().includes(query))
        );

      } else if (this.persist.matched !== Matched.any) {
        const expectMatch = this.persist.matched === Matched.only;

        data = data.filter(item =>
          ((item.mk) !== null) === expectMatch
        );
      }

      return data;
    }
  },
  methods: {
    // Pagination
    getPageClass(idx: number): string {
      const isCurrentPage = idx === this.currentPage ||
        (idx === this.numPages && this.currentPage > this.numPages);
      return `col md-btn page-btn${isCurrentPage ? ' md-btn-primary' : ''}`;
    },
    changePage(event: any) {
      const value = event!.target!.valueAsNumber;

      if (!isNaN(value) && value >= 1 && value <= this.numPages) {
        this.persist.page[this.persist.type] = value;
      }
    },
    goToPage(page: number) {
      this.persist.page[this.persist.type] = page;
    },
    goToPrevious: function () {
      if (this.currentPage > 1) {
        this.persist.page[this.persist.type] -= 1;
      }
    },
    goToNext: function () {
      if (this.currentPage < this.numPages) {
        this.persist.page[this.persist.type] += 1;
      }
    },
    goToEnd: function () {
      this.persist.page[this.persist.type] = this.numPages;
    },
    // Recommendations
    async fetchRecommendations(): Promise<void> {
      if (this.count !== null) return;

      if (killed) killed = false;

      const user = this.username;
      const type = this.persist.type;
      const count = this.persist.fetch;
      const existingCount = Object.keys(this.persist[type]).length;

      if (count !== -1 && count < existingCount) {
        this.app.confirm(`You currently have ${existingCount} recommendations, but are fetching ${count}. Only the top ${count} will be saved. Proceed?`, () => {
          this.doFetch(user, type, count)
            .catch(error => {
              console.error(`[plugin][%s]:`, PLUGIN_NAME, error);
            });
        })
      } else {
        await this.doFetch(user, type, count);
      }
    },
    async doFetch(user: string, type: RecommendationType, count: number): Promise<void> {
      this.count = 0;
      this.outOf = 0;

      // Per API docs, this is guaranteed to be sorted in decreasing order
      let recommendations: Recommendation[] = [];

      if (this.persist.fetch !== -1) {
        recommendations = (await this.fetchRecs(user, type, count)).payload.mbids;
      } else {
        for (; ;) {
          const recs = await this.fetchRecs(user, type, 1000, recommendations.length);

          recommendations = recommendations.concat(recs.payload.mbids);

          if (recommendations.length >= recs.payload.total_mbid_count) {
            break;
          }
        }
      }

      this.outOf = recommendations.length;
      const recs = this.persist[this.persist.type];

      let newCount = 1;

      // Inside this loop, we modify the current mapping of recommendations. This is primarily
      // so that they can be 
      for (const rec of recommendations) {
        const existing = recs[rec.recording_mbid];

        if (killed) break;

        if (!existing) {
          const now = performance.now();

          try {
            const mbData = await fetch(`https://musicbrainz.org/ws/2/recording/${rec.recording_mbid}?fmt=json&inc=releases+artists+isrcs`, {
              headers: {
                "User-Agent": USER_AGENT
              }
            });

            const json = await mbData.json() as Recording;

            const elapsed = performance.now() - now;
            // The rate limit is 1 request/sec/ip, but let's be more cautious
            await StorageUtil.sleep(Math.ceil(1000 - elapsed));

            let artistNames = "";

            for (const artist of json["artist-credit"]) {
              artistNames += artist.name + artist.joinphrase;
            }

            const data: MatchedRecommendation = {
              by: artistNames,
              mk: null,
              listen: rec.latest_listened_at,
              score: rec.score,
              title: json.title
            };

            if (json.isrcs.length > 0) {
              const response = await this.app.mk.api.v3.music(
                `/v1/catalog/${this.app.mk.storefrontCountryCode}/songs?filter[isrc]=${json.isrcs.join(", ")}`
              );

              if (response.response.ok && response.data.data.length > 0) {
                for (const item of response.data.data) {
                  if (item.meta?.redeliveryId) continue;

                  data.mk = item.id;
                  this.$set(this.cached, data.mk!, item);
                  break;
                }
              }
            }

            if (!data.mk) {
              const query = encodeURIComponent(`${json.title} - ${artistNames}`);
              const response = await this.app.mk.api.v3.music(`/v1/catalog/${this.app.mk.storefrontCountryCode}/search?term=${query}&limit=25&types=songs`);

              if (response.response.ok && response.data.results.songs?.data.length === 1) {
                const item = response.data.results.songs.data[0];
                data.mk = item.id;
                this.$set(this.cached, data.mk!, item);
              }
            }

            this.$set(recs, rec.recording_mbid, data);
          } catch (error) {
            console.error(`[plugin][%s]:`, PLUGIN_NAME, error);
          }

          newCount += 1;
        } else {
          existing.listen = rec.latest_listened_at;
          existing.score = rec.score;

          recs[rec.recording_mbid] = existing;
        }

        this.count += 1;

        // every 30 new songs, checkpoint
        if (newCount % 30 === 0) {
          StorageUtil.setStorage("recommendation", this.persist, true);
        }

        this.$set(this, "recs", recs);
      }

      // Sort the new object
      const newRecs: Record<string, MatchedRecommendation> = {};

      let addCount = 0;

      for (const [key, match] of Object.entries(this.persist[type]).sort((a, b) => b[1].score - a[1].score)) {
        newRecs[key] = match;

        addCount++;

        // We only support having the top X recommendations
        // This is to prevent indefinite growth
        if (addCount === recommendations.length) {
          break;
        }
      }

      this.persist[type] = newRecs;
      this.count = null;
      this.outOf = null;

      StorageUtil.setStorage("recommendation", this.persist, true);
    },
    async fetchRecs(user: string, type: RecommendationType, count: number, offset = 0): Promise<Payload> {
      const data = await fetch(`https://api.listenbrainz.org/1/cf/recommendation/user/${user}/recording?artist_type=${type}&count=${count}&offset=${offset}`, {
        headers: {
          "User-Agent": USER_AGENT
        }
      });

      const remainingCalls = parseInt(data.headers.get("x-ratelimit-remaining")!);

      if (remainingCalls === 0) {
        const resetInSec = parseInt(data.headers.get("x-ratelimit-reset-in")!);
        await StorageUtil.sleep(resetInSec * 1000);
      }

      return data.json();
    },
    search(title: string): void {
      this.app.search.term = title;
      this.app.searchQuery();
      this.app.showSearch();
    },
    update(): void {
      StorageUtil.setStorage("recommendation", this.persist, true);
    },
    cacheChange(id: string, score: number): void {
      this.$emit("cache", id, score);
    },
    kill() {
      killed = true;
    },
    nuke() {
      const type = this.persist.type;

      this.app.confirm(`Are you sure you want to delete all '${type}' recommendations?`, (result: boolean) => {
        if (result) {
          this.persist[type] = {};
          StorageUtil.setStorage("recommendation", this.persist, true);
        }
      });
    }
  }
});

