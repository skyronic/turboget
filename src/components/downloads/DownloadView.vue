<template>
  <div class="h-100 w-100">
    <div class="d-flex align-items-center dl-toolbar p-3">
      <div class="kpi">
        <strong>{{ activeCount }}</strong>
        <small class="text-muted">Running</small>
      </div>
      <div class="kpi">
        <strong>{{ waitingCount }}</strong>
        <small class="text-muted">Waiting</small>
      </div>
      <div class="kpi">
        <strong>{{ completeCount }}</strong>
        <small class="text-muted">Complete</small>
      </div>
      <div class="kpi">
        <strong>{{ totalSpeed }}</strong>
        <small class="text-muted">Speed</small>
      </div>
      <div class="flex-grow-1"></div>
      <div>
        <b-button-toolbar key-nav aria-label="Toolbar with button groups">
          <b-button-group class="mx-1">
            <b-button @click.prevent="pauseAll()">Pause All</b-button>
            <b-button @click.prevent="resumeAll()">Resume All</b-button>
            <b-button @click.prevent="removeAll()">Remove All</b-button>
          </b-button-group>
          <b-button-group class="mx-1">
            <b-button @click.prevent="clearComplete()">Clear Complete</b-button>
          </b-button-group>
        </b-button-toolbar>
      </div>
    </div>
    <download-table></download-table>
  </div>
</template>

<script>
  import {mapActions, mapGetters, mapMutations} from "vuex";
import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn } from "util/log";
  import DownloadTable from "components/server/DownloadTable";
let bytes = require('bytes')

export default {
  data() {
    return {

    };
  },
  components: {
    DownloadTable
  },
  methods: {
    ...mapActions({
      'refreshDownloads': 'download/refresh',
      'pauseAll': 'download/pauseAll',
      'resumeAll': 'download/resumeAll',
      'removeAll': 'download/removeAll',
      'clearComplete': 'download/clearComplete'
    }),
    bytes(val) {
      return bytes(parseInt(val))
    },
    file(d) {
      return d.info.files[0];
    }
  },
  mounted() {
    let self = this;
    setInterval(() => {
      // this.refreshDownloads();
    }, 2000)
  },
  props: {

  },
  computed: {
    ...mapGetters({
      downloads: "download/readyItems"
    }),
    activeCount ()  {
      return _.filter(this.downloads, d => d.info.status === 'active').length;
    },
    waitingCount()  {
      return _.filter(this.downloads, d => d.info.status === 'waiting').length;
    },
    completeCount()  {
      return _.filter(this.downloads, d => d.info.status === 'complete').length;
    },
    totalSpeed () {
      return this.bytes(_.sum(_.map(this.downloads, d => parseInt(d.info.downloadSpeed)))) + "/s"
    }
  }
};
</script>

<style>
  .dl-toolbar {
    height: 50px;
    background-color: #bcdefa;
  }

  .kpi {
    font-size: 18px;
    margin-right: 10px;
  }
</style>