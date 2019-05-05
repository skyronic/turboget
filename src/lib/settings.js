import _ from "lodash";
import mget from "util/mget";
import {info, debug, warn, priv} from "util/log";
import store from "store";
import default_settings from './default_settings';
let remote = window.require("electron").remote;
let app = remote.app;

let fs = window.require("fs");
let path = window.require("path");

let settingsPath = path.join(app.getPath('userData'), "settings", "settings.json");

const readSettingsFromFile = function() {
  if (fs.existsSync(settingsPath)) {
    debug("Found settings file");
    priv("Settings path", settingsPath);
    let contents = fs.readFileSync(settingsPath);
    return _.extend(_.cloneDeep(default_settings), JSON.parse(contents));
  } else {
    warn("Settings file does not exist.");
    priv("Settings path", settingsPath);
    return _.cloneDeep(default_settings);
  }
};

const writeSettingsToFile = function(settings) {
  // if a file already exists, create a backup
  if (fs.existsSync(settingsPath)) {
    fs.copyFileSync(settingsPath, settingsPath + ".bak");
  }
  else {
    let settingsDir = path.dirname(settingsPath);
    if(!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, {recursive: true})
    }
  }
  fs.writeFileSync(settingsPath, JSON.stringify(settings));
};

function addSettingsToStore(settings) {
  store.commit("server/restoreFromSettings", {items: settings.server.items});
  store.commit("library/restoreFromSettings", {items: settings.library.items});

  // If any migrations are made, be sure to re-write them into the file
  updateSettingsFile();
}

export const updateSettingsFile = function() {
  let settings = {
    server: {
      items: store.getters["server/forSettings"]
    },
    library: {
      items: store.getters["library/forSettings"]
    }
  };
  info("Generated settings", settings);
  writeSettingsToFile(settings);
};

export const initSettings = () => {
  return new Promise((resolve, reject) => {
    let settings = readSettingsFromFile();
    addSettingsToStore(settings);

    resolve();
  });
};
