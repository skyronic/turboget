<template>
  <div>
    <b-button :variant="buttonVariant" id="conn_state">{{ buttonText }}</b-button>
    <b-popover target="conn_state" placement="bottom" triggers="focus blur" :disabled="connState !== 'error'"  >
      <template slot="title"
        >Connection Error</template
      >
      There was an error connecting to your seedbox. This could be an issue with your configuration or internet. You can edit server settings or retry connection.
      <b-button @click="retryConnection" class="mt-2">Retry</b-button>
    </b-popover>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn } from "util/log";

export default {
  data() {
    return {};
  },
  methods: {
    ...mapMutations([]),
    retryConnection () {
      this.$root.$emit('bv::hide::popover')
      this.$emit('doRetry');
    }
  },
  mounted() {
  },
  components: {},
  props: {
    connState: String
  },
  computed: {
    ...mapGetters([]),
    buttonVariant () {
      return {
        "down": "outline-secondary",
        "connecting": "outline-warning",
        "connected": "outline-success",
        "error": "outline-danger",
      }[this.connState];
    },
    buttonText() {
      return {
        "down": "Disconnected",
        "connecting": "Connecting",
        "connected": "Connected",
        "error": "Connection Error",
      }[this.connState];
    }
  }
};
</script>

<style></style>
