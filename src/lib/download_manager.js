import slugify from "slugify";

const aria2c_launcher = window.require("aria2c-static-electron");
const Aria2 = require("aria2");
import { info, warn } from "util/log";
let cp = window.require("child_process");
let HttpDigest = require ("lib/http_digest");
let fs = window.require("fs");
let os = window.require("os");
let path = window.require("path");
import store from "store";
import { makeFolderNameForTorrent } from "store/torrent";
let rts = require("remove-trailing-slash");

let adm = null;
let ap = null;
let secret = "foobar"  + _.random(0, 1000);

const downloadHttp = async (url, dir, config) => {
  let ariaConfig = {};

  ariaConfig["dir"] = dir;
  // ariaConfig["max-download-limit"] = "400K";

  let username = config.username;
  let password = config.password;

  if(!config.download.http.server_creds) {
    username = config.download.http.username;
    password = config.download.http.password;
  }

  if(config.download.http.auth === 'basic') {
    ariaConfig["http-user"] = username;
    ariaConfig["http-passwd"] = password;
  } else if (config.download.http.auth === 'digest') {
    let digest_builder = new HttpDigest(username, password);
    let [err] = await digest_builder.setup("GET", url);
    if(err) {
      warn("error setting up digest header");
      return [err];
    }

    ariaConfig["header"] = "Authorization: " + digest_builder.getHeader();
  }

  return await adm.call("addUri", [url], ariaConfig);
};

const downloadFtp = async (url, dir, config, sftp = false) => {
  info("Downloading file from ftp", url, sftp);
  let ariaConfig = {};

  ariaConfig["dir"] = dir;
  // ariaConfig["max-download-limit"] = "100K";

  ariaConfig["ftp-user"] = config.download.ftp.username;
  ariaConfig["ftp-passwd"] = config.download.ftp.password;

  return await adm.call("addUri", [url], ariaConfig);
};

function buildFtpUrl(
  ftp,
  sftp = false,
  secure_ftp = false,
  singleFile,
  name,
  filePath
) {
  let protocol = sftp ? "sftp" : "ftp";
  if (secure_ftp) protocol = "ftps";
  let folder = singleFile ? "" : name + "/";
  let first_separator = sftp ? "/" : "/";
  let rootFolder = rts(ftp.folder);

  // sftp://2.2.2.2//Downloads/mozart-discography/
  return `${protocol}://${ftp.host}:${
    ftp.port
  }${first_separator}${rootFolder}/${folder}${filePath}`;
}

export const downloadFile = async (
  torrentInfo,
  fileInfo,
  serverConfig,
  libraryConfig,
  singleFile = false
) => {
  let dir = path.join(
    libraryConfig.target,
    makeFolderNameForTorrent(torrentInfo),
    fileInfo.path
  );
  dir = path.dirname(dir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (serverConfig.download.mode === "http") {
    // let url = serverConfig.download.http.baseUrl + fileInfo.path;
    let url =
      rts(serverConfig.download.http.baseUrl) +
      "/" +
      (singleFile ? "" : torrentInfo.name + "/") +
      fileInfo.path;
    return await downloadHttp(url, dir, serverConfig);
  } else if (serverConfig.download.mode === "ftp") {
    let ftp = serverConfig.download.ftp;
    let sftp = ftp.protocol === "sftp";
    let secure_ftp = ftp.protocol === "ftp-ssl";
    let url = buildFtpUrl(
      ftp,
      sftp,
      secure_ftp,
      singleFile,
      torrentInfo.name,
      fileInfo.path
    );

    return await downloadFtp(url, dir, serverConfig, sftp);
  }
};

export const getDownloadsStatus = async keyList => {
  let result = [];
  for (let i = 0; i < keyList.length; i++) {
    let gid = keyList[i];

    const params = await adm.call("tellStatus", gid, [
      "gid",
      "status",
      "downloadSpeed",
      "files",
      "errorCode",
      "errorMessage"
    ]);
    result.push({
      key: gid,
      info: params
    });
  }
  return result;
};

function setupAriaProcess() {
  return new Promise((resolve, reject) => {
    let path = aria2c_launcher.path;
    if (os.platform() === "darwin" || os.platform() === "linux") {
      fs.chmodSync(path, 0o775);
    }
    ap = cp.spawn(
      aria2c_launcher.path,
      ["--enable-rpc", "--rpc-secret=" + secret, "--check-certificate=false"],
      {
        detached: false
      }
    );
    setTimeout(() => resolve(), 1000);
  });
}

window.onbeforeunload = e => {
  if (ap) {
    info("Closing aria process");
    ap.kill();
  }
};

function setupAriaClient() {
  return new Promise((resolve, reject) => {
    adm = new Aria2({
      host: "localhost",
      port: 6800,
      secure: false,
      secret,
      path: "/jsonrpc"
    });
    adm
      .open()
      .then(() => {
        info("Opened connection to aria2c");
        resolve();
      })
      .catch(err => {
        warn("Failed to connect to aria2c");
        reject(err);
      });
  });
}

export const initDownloadManager = function() {
  return setupAriaProcess()
    .then(() => {
      return setupAriaClient();
    })
    .then(() => {
      setInterval(() => {
        // TODO: ideally don't want to call the store method right here
        store.dispatch("download/refresh");
      }, 2000);
      return Promise.resolve();
    });
};

export const pauseAllDownloads = async function() {
  const result = await adm.call("pauseAll", []);
};

export const resumeAllDownloads = async function() {
  const result = await adm.call("unpauseAll", []);
};

export const removeDownload = async function(gid) {
  await adm.call("remove", gid);
};
