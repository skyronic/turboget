import Vue from "vue";
import App from "components/App.vue";
import BootstrapVue from "bootstrap-vue";
import { initSettings } from "lib/settings";
import store from "store";
import { initDownloadManager } from "lib/download_manager";
import {initUpdateManager} from "lib/update_manager";
import {showError, startErrorMonitoring} from "lib/errors";

let pjson = require('../package.json');


// Setup vue
Vue.use(BootstrapVue);
Vue.config.productionTip = false;

// Init everything
startErrorMonitoring();
initSettings()
  .then(() => {
    initUpdateManager(pjson.version);
    return initDownloadManager();
  })
  .then(() => {
    // start the application
    new Vue({
      store,
      render: h => h(App)
    }).$mount("#app");
  });

