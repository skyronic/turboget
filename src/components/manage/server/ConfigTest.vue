<template>
  <div class="d-flex align-items-baseline">
    <b-button class="mr-2" @click="runTest" :disabled="testRunning">{{ buttonText }}</b-button>
    <b-alert
      v-model="showAlert"
      :variant="testPassed ? 'success' : 'danger'"
      dismissible
      class="flex-grow-1"
      >{{ testResult }}</b-alert
    >
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import _ from "lodash";
import { info, debug, warn } from "util/log";
import {
  checkFtpConfig,
  checkHttpConfig,
  checkRTorrentConfig,
  checkSftpConfig
} from "components/manage/server/config_checks";

export default {
  data() {
    return {
      testRunning: false,
      showAlert: false,
      testPassed: true,
      testResult: ""
    };
  },
  methods: {
    ...mapMutations([]),
    async runTest() {
      this.testRunning = true;
      let [err, result] = [true, "Unknown error"];
      if (this.testName === "rutorrent") {
        [err, result] = await checkRTorrentConfig(this.serverConfig);
      }
      if (this.testName === "ftp") {
        [err, result] = await checkFtpConfig(this.serverConfig);
      }
      if (this.testName === "sftp") {
        [err, result] = await checkSftpConfig(this.serverConfig);
      }
      if (this.testName === "http") {
        [err, result] = await checkHttpConfig(this.serverConfig);
      }
      this.testPassed = !err;
      this.testResult = result;
      this.showAlert = true;
      this.testRunning = false;
    }
  },
  mounted() {},
  props: {
    buttonText: "",
    testName: "",
    serverConfig: Object
  },
  computed: {
    ...mapGetters([])
  }
};
</script>

<style></style>
