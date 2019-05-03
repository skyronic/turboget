<template>
  <div>
    <div class="w-100 tlToolbar py-2 px-3 d-flex">
      <b-button size="md" variant="outline-light" v-b-modal.add-torrent-modal
        @click="magnetURL = ''">Add Torrent</b-button
      >
      <b-modal
        id="add-torrent-modal"
        title="Add Torrent"
        ref="add_modal"
        @ok="handleAddTorrent"
      >
        <div class="">
          <b-form-group label="Magnet URL:">
            <b-form-input v-model="magnetURL"></b-form-input>
            <b-form-invalid-feedback :state="magnetValidation">
              That doesn't look like a valid Magnet Link.
            </b-form-invalid-feedback>
            <b-form-invalid-feedback :state="addServerError">
              There was an error adding your torrent.
            </b-form-invalid-feedback>
          </b-form-group>
          <p>(only magnet URLs are supported for now)</p>
        </div>
      </b-modal>
      <div class="flex-grow-1"></div>
      <status-button
        :conn-state="server.connState"
        @doRetry="retryConnection()"
      ></status-button>
    </div>
    <div class="w-100">
      <div
        v-for="t in torrents"
        :key="t.key"
        class="torrentItem px-3 py-2"
        @click="selectTorrent(t.key)"
        :class="t.key === activeTorrent ? 'itemActive' : ''"
      >
        <div class="d-flex align-items-center">
          <div class="torrentName">
            {{ t.info.name }}
          </div>
          <b-badge
            class="ml-2"
            :variant="isRunning(t) ? 'success' : 'secondary'"
            >{{ isRunning(t) ? "Running" : "Stopped" }}</b-badge
          >
          <div class="flex-grow-1"></div>
          <div class="text-muted">
            {{ getPercentageComplete(t) }}
          </div>
        </div>
        <div class="d-flex align-items-center mt-1">
          <div class="text-muted text-sm-left">
            Down: {{ formatSize(t.info.bytes_done) }} ({{
              formatSpeed(t.info.down_rate)
            }})
          </div>
          <div class="text-muted text-sm-left ml-2">
            Up: {{ formatSize(t.info.up_total) }} ({{
              formatSpeed(t.info.up_rate)
            }})
          </div>
          <div class="flex-grow-1"></div>
          <div>
            Ratio:
            {{
              Number.parseFloat(
                t.info.up_total / t.info.bytes_done
              ).toPrecision(2)
            }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import {mapActions, mapGetters, mapMutations, mapState} from "vuex";
import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn } from "util/log";
import StatusButton from "components/server/StatusButton";
  import {makeProvider} from "../../providers";
let parseTorrent = require("parse-torrent");
let bytes = require("bytes");

export default {
  data() {
    return {
      magnetURL: "",
      magnetValidation: true,
      addServerError: true
    };
  },
  methods: {
    ...mapMutations({
      selectTorrent: "ui/setTorrent"
    }),
    ...mapActions({
      serverRefresh: "server/refresh"
    }),
    formatSpeed(val) {
      return bytes(val) + "/s";
    },
    formatSize(val) {
      return bytes(val);
    },
    getPercentageComplete(t) {
      return Math.ceil((t.info.size / (t.info.left + t.info.size)) * 100) + "%";
    },
    isRunning(t) {
      return t.info.running_state === 1;
    },
    retryConnection() {
      this.$store.dispatch("server/refresh", {
        key: this.serverKey,
        connState: "connecting"
      });
    },
    async handleAddTorrent(e) {
      e.preventDefault();
      try {
        this.magnetValidation = true;
        this.addServerError = true;
        parseTorrent(this.magnetURL);
      } catch (e) {
        this.magnetValidation = false;
        return;
      }

      // we don't need anything from the torrent

      let provider = makeProvider(this.serverKey);
      let [error] = await provider.addMagnetUrl(this.magnetURL);
      if(error) {
        this.addServerError = false;
        return;
      }

      // everything succeeded. Close the modal and refresh server
      this.serverRefresh({key: this.serverKey});
      this.$refs.add_modal.hide();
    }
  },
  mounted() {},
  components: {
    StatusButton
  },
  props: {
    serverKey: String
  },
  computed: {
    ...mapGetters({
      "allTorrents": "torrent/items"
    }),
    torrents() {
      return _.filter(this.allTorrents, {server: this.serverKey});
    },
    server() {
      return mget.server.fromKey(this.serverKey);
    },
    ...mapState({
      activeTorrent: s => s.ui.activeTorrent
    })
  }
};
</script>

<style>
.tlToolbar {
  background-color: #1b3d5a;
  border-bottom: 1px solid #6cb2eb;
}
.torrentItem {
  width: 100%;
  height: 4.8rem;
  border-bottom: 1px solid #dee2e6;
}

.torrentName {
  font-size: 1.2rem;
  max-width: 500px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.itemActive {
  background-color: #bcdefa;
}
</style>
