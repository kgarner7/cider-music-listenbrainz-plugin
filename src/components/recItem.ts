import Vue, { PropType } from "vue";
import { PLUGIN_NAME } from "../consts";

export interface MatchedRecommendation {
  by: string;
  mk: string | null;
  listen: string | null;
  score: number;
  title: string;
}

export default Vue.component(`plugin.${PLUGIN_NAME}.item`, {
  template: `
  <div>
    <template v-if="item.mk === null">
      <div class="artist item-navigate brainz" @click="search(item.title + ' - ' + item.by)" stye="padding: 10px 0px;">
        {{ item.title }}: {{ item.by }}
      </div>
    </template>
    <template v-else>
      <div class="brainz" :data-id="item.mk">{{ item.title }}: {{ item.by }}</div>
      <mediaitem-list-item v-if="cached[item.mk]" :item="cached[item.mk]"/>
    </template>
  </div>
  `,
  props: {
    cached: { type: Object, required: true },
    item: { type: Object as PropType<MatchedRecommendation>, required: true }
  },
  watch: {
    item: {
      handler() {
        this.refetch()
      }
    }
  },
  async mounted() {
    this.refetch();
  },
  methods: {
    refetch() {
      const id = this.item.mk;

      if (id && !this.cached[id]) {
        this.$emit("cache", id, this.item.score);
      }
    }
  }
});