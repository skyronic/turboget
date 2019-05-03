<template>
  <div>
    <b-form @submit.prevent="saveConfig">
      <div class="card">
        <div class="card-header">
          Configuration
        </div>
        <div class="card-body">
          <b-form-group label="Name:">
            <b-form-input v-model="config.name"></b-form-input>
          </b-form-group>
          <b-form-group label="Download location:">
            <div class="card card-body">{{ config.target }}</div>
            <div class="d-flex flex-row mt-2">
              <b-button @click="selectFolder()"class="mr-2">Select Directory</b-button>
              <b-button @click="createDefaultFolder()">Use "Downloads/turboget" folder</b-button>
            </div>
          </b-form-group>
        </div>
      </div>
      <b-button type="submit" variant="primary" class="mt-4">Save</b-button>
    </b-form>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import _ from "lodash";
import mget from "util/mget";
import default_settings from 'lib/default_settings';
import {updateSettingsFile} from "lib/settings";
let electron = window.require("electron");
let path = window.require("path");
let fs = window.require("fs");

export default {
  data() {
    return {
      // TODO: make this a bit better
      config: _.clone(default_settings.library.items[0].config)
    };
  },
  methods: {
    ...mapMutations({
      'saveLibraryConfig': "library/setConfig"
    }),
    saveConfig() {
      this.config.configReady = true;
      this.saveLibraryConfig({key: this.libraryKey, config: this.config})
      updateSettingsFile();
      this.refreshConfig();
    },
    selectFolder () {
      let dir = electron.remote.dialog.showOpenDialog({properties: ["openDirectory", "createDirectory"]});
      this.config.target = dir[0];
    },
    createDefaultFolder () {
      let dlpath = path.join(electron.remote.app.getPath("downloads"), "turboget");
      if(!fs.existsSync(dlpath)) {
        fs.mkdirSync(dlpath, {recursive: true});
      }
      this.config.target = dlpath;

    },
    refreshConfig () {
      let library = mget.library.fromKey(this.libraryKey);
      this.config = _.clone(library.config);
    }
  },
  mounted() {
    this.refreshConfig();
  },
  props: {
    libraryKey: String
  },
  watch: {
    libraryKey() {
      this.refreshConfig();
    }
  },
  components: {
  },
  computed: {
    ...mapGetters([])
  }
};
</script>

<style></style>
