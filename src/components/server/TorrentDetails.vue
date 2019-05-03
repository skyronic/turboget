<template>
  <div>
    <div class="w-100 tdToolbar py-2 px-3" style="height: 52px;">
      <div v-if="t">
        <b-button
          size="md"
          variant="outline-light"
          @click="toggleTorrentPause()"
          >{{ torrentIsRunning ? "Pause" : "Resume" }}</b-button
        >
      </div>
    </div>
    <div v-if="!t" class="mt-4 text-center">Please select a torrent</div>
    <div v-if="t" class="p-3">
      <h3>{{ t.info.name }}</h3>
      <h4 class="mt-3">Download:</h4>
      <div v-if="t.info.complete">
        <div class="card">
          <div class="card-body">
            <div class="d-flex align-items-center w-100">
              <div class="flex-grow-1 mr-4">
                Download all to:
              </div>
              <b-form-select
                v-model="targetLib"
                :options="libraries"
                class="mr-2 col-md-4"
                style="appearance:none"
              ></b-form-select>
              <b-button variant="primary" @click="downloadAll"
                >Download</b-button
              >
            </div>
            <div>
              Files will be downloaded to:
              <pre class="text-sm-left">{{ getTargetFilePath(t) }}</pre>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!t.info.complete">
        <div class="card">
          <div class="card-body">
            Please wait until the seedbox finishes downloading the torrent.
          </div>
        </div>
      </div>
      <h4 class="mt-3">Files:</h4>
      <div class="bg-white p-2 border">
        <b-table
          borderless
          small
          :items="fileTable"
          :per-page="10"
          :current-page="currentPage"
          :fields="fields"
        >
        </b-table>
        <b-pagination
          v-if="fileTable.length > 10"
          v-model="currentPage"
          :total-rows="fileTable.length"
          :per-page="10"
        ></b-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations, mapState } from "vuex";
import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn } from "util/log";
import { makeFolderNameForTorrent } from "store/torrent";
import { makeProvider } from "../../providers";
import { showError } from "lib/errors";
let bytes = require("bytes");
let path = window.require("path");

export default {
  data() {
    return {
      currentPage: 1,
      fields: {
        name: {
          label: "Name",
          tdClass: "filePathCell"
        },
        size: {
          label: "Size"
        },
        // complete: {
        //   label: "Complete"
        // }
      },
      targetLib: "default"
    };
  },
  methods: {
    downloadFile(f) {
      this.startDownload({
        fileKey: f.key,
        libraryKey: "default"
      });
    },
    async downloadAll() {
      for (let i = 0; i < this.files.length; i++) {
        await this.startDownload({
          fileKey: this.files[i].key,
          libraryKey: this.targetLib,
          singleFile: this.files.length === 1
        });
      }
    },
    async toggleTorrentPause() {
      let provider = makeProvider(this.t.server);
      if (this.torrentIsRunning) {
        let [err] = await provider.pauseTorrent(this.t.key);
        if (err) {
          showError({ message: "Could not pause torrent" });
        }
      } else {
        let [err] = await provider.resumeTorrent(this.t.key);
        if (err) {
          showError({ message: "Could not resume torrent" });
        }
      }
    },
    ...mapActions({
      fetchFiles: "file/fetchFiles",
      startDownload: "download/downloadFile",
      refreshDownloads: "download/refresh"
    }),
    formatSize(val) {
      return bytes(val);
    },
    getTargetFilePath(t) {
      let lib = mget.library.fromKey(this.targetLib);
      return path.join(
        lib.config.target,
        makeFolderNameForTorrent(t.info),
        "/"
      );
    }
  },
  mounted() {},
  props: {},
  watch: {
    t() {
      if (this.t) {
        this.fetchFiles(this.t.key);
      }
    }
  },
  computed: {
    torrentIsRunning() {
      return this.t && this.t.info.running_state === 1;
    },
    fileTable() {
      return _.map(this.files, f => {
        return {
          name: f.info.path,
          size: this.formatSize(f.info.size),
          complete:
            Math.ceil(f.info.completed_chunks / f.info.size_chunks) * 100 + "%"
        };
      });
    },
    ...mapState({
      activeTorrent: s => s.ui.activeTorrent
    }),
    ...mapGetters({
      fileFilter: "file/filterByTorrent",
      libraries: "library/forSelect"
    }),
    files() {
      if (this.t) {
        return this.fileFilter(this.t.key);
      }
      return [];
    },
    limitedFiles() {
      return _.slice(this.files, 0, 15);
    },
    fileLengthRemaining() {
      return this.files.length - this.limitedFiles.length;
    },
    t() {
      if (this.activeTorrent && this.activeTorrent.length > 0) {
        return mget.torrent.fromKey(this.activeTorrent);
      }
      return null;
    }
  }
};
</script>

<style>
.tdToolbar {
  background-color: #12273a;
  border-bottom: solid 1px #3490dc;
}

.fileItem {
  width: 100%;
  border: solid 1px #aaa;
  background: white;
}

.filePathCell {
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 270px;
  overflow: hidden;
}
</style>
