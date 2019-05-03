import _ from 'lodash';
import mget from "util/mget";
import store from 'store';
import { info, debug, warn } from "util/log";
let axios = require('axios');
let semver = require('semver');

let checkForUpdate = (currentVer) => {
  axios.get("https://turboget.co/update/release.json")
    .then((response) => {
      if(response && response.data && response.data.latest) {
        if(semver.gt(response.data.latest.version, currentVer)) {
          store.commit("ui/hasUpdate", response.data.latest);
        }
      }
    })
};

export const initUpdateManager = function (currentVer) {
  checkForUpdate(currentVer);
  setInterval(() => {
    checkForUpdate(currentVer)
  }, 3600000);
};