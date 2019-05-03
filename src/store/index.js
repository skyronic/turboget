import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

import { serverModule } from "./server";
import { libraryModule } from "./library";
import { torrentModule } from "./torrent";
import { uiModule } from "store/ui";
import { fileModule } from "store/file";
import {downloadModule} from "store/download";

export default new Vuex.Store({
  strict: true,
  modules: {
    server: serverModule,
    library: libraryModule,
    torrent: torrentModule,
    file: fileModule,
    ui: uiModule,
    download: downloadModule
  },
  state: {},
  mutations: {},
  getters: {},
  actions: {}
});
