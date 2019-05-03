<template>
  <div>
    <div class="navBarContainer">
      <nav-bar></nav-bar>
    </div>
    <div class="pageContainer">
      <server-view
        v-if="current_page === 'server'"
        server-key="default"
      ></server-view>
      <download-view v-if="current_page === 'download'"></download-view>
      <manage-servers v-if="current_page === 'manage-servers'"></manage-servers>
      <manage-libraries
        v-if="current_page === 'manage-libraries'"
      ></manage-libraries>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations, mapState } from "vuex";
import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn } from "util/log";
import NavBar from "components/layout/NavBar.vue";
import ManageServers from "components/manage/server/ManageServers.vue";
import ManageLibraries from "components/manage/library/ManageLibraries";
import ServerView from "components/server/ServerView";
import DownloadView from "components/downloads/DownloadView";

export default {
  data() {
    return {};
  },
  components: {
    NavBar,
    ManageServers,
    ManageLibraries,
    ServerView,
    DownloadView
  },
  methods: {
    ...mapMutations([])
  },
  mounted() {},
  props: {},
  computed: {
    ...mapState({ current_page: s => s.ui.page })
  }
};
</script>

<style>
.navBarContainer {
  height: 56px;
}
.pageContainer {
  top: 56px;
  bottom: 0;
  left: 0;
  right: 0;
  position: absolute;
}
</style>
