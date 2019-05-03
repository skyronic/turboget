<template>
  <div>
    <b-navbar type="dark" variant="primary" class="tg-navbar">
      <b-navbar-brand href="#" @click.prevent="setPage('server')">{{ activeServer }}</b-navbar-brand>
      <b-navbar-nav>
        <b-nav-item-dropdown text="" right>
          <b-dropdown-item href="#">{{ activeServer }}</b-dropdown-item>
        </b-nav-item-dropdown>
        <b-nav-item href="#" @click.prevent="setPage('download')">Download
          <b-badge variant="success" v-if="downloadCount > 0">{{ downloadCount }} running</b-badge>
        </b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav class="ml-auto">
        <b-nav-item href="#" @click.prevent="openUpdatePage" v-if="update.available">Update Available
          <b-badge variant="success">{{ update.version }}</b-badge>
        </b-nav-item>
        <b-nav-item-dropdown text="Settings" right>
          <b-dropdown-item href="#" @click="setPage('manage-servers')">Manage Servers</b-dropdown-item>
          <b-dropdown-item href="#" @click="setPage('manage-libraries')">Manage Libraries</b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-navbar>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn } from "util/log";
let electron = window.require("electron");

export default {
  data() {
    return {

    };
  },
  methods: {
    ...mapMutations({setPage: 'ui/setPage'}),
    openUpdatePage () {
      electron.shell.openExternal(this.update.url);
    }
  },
  mounted() {

  },
  props: {

  },
  computed: {
    ...mapGetters({
      activeServer: "ui/activeServerName",
      update: "ui/update",
      downloadCount: "download/activeCount"
    })
  }
};
</script>

<style>
  .tg-navbar {
   height: 56px;
  }
</style>