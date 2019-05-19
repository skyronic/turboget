<template>
  <div class="d-flex align-items-stretch h-100">
    <div class="border-right h-100 torrentListContainer">
      <torrent-list :server-key="serverKey" v-if="appReady"></torrent-list>
      <div class="mt-5" v-if="!appReady">
        <div v-if="!server.config.configReady" class="text-lg-center">
          Please configure your seedbox server.
          <a href="#" @click.prevent="setPage('manage-servers')">Click here</a>
        </div>
        <div v-if="!libReady" class="text-lg-center mt-2">
          Please configure your default download library.
          <a href="#" @click.prevent="setPage('manage-libraries')">Click here</a>
        </div>
      </div>
    </div>
    <div class="h-100 bg-light torrentDetailsContainer">
      <torrent-details></torrent-details>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from "vuex";
import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn } from "util/log";
import TorrentDetails from "components/server/TorrentDetails";
import TorrentList from "components/server/TorrentList";

export default {
  data() {
    return {};
  },
  methods: {
    ...mapMutations({
      setPage: "ui/setPage",
      setConnState: "server/setConnState"
    }),
    ...mapActions({
      refreshTorrents: "torrent/refreshTorrents",
    })
  },
  mounted() {
    this.setConnState({key: this.serverKey, connState:"connecting"});
  },
  components: {
    TorrentList,
    TorrentDetails
  },
  props: {
    serverKey: String
  },
  watch: {
    serverKey() {
      this.setConnState({key: this.serverKey, connState:"connecting"});
    }
  },
  computed: {
    ...mapGetters({
      libReady: "library/defaultLibraryReady"
    }),
    server() {
      return mget.server.fromKey(this.serverKey);
    },
    appReady() {
      return this.server.config.configReady && this.libReady;
    }
  }
};
</script>

<style>
.torrentListContainer {
  width: 60%;
  overflow-y: auto;
}

.torrentDetailsContainer {
  width: 40%;
  overflow-y: auto;
}
</style>
