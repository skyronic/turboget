import _ from "lodash";
import { info, debug, warn } from "util/log";
import xmlrpc from "xmlrpc";
import {
  createRTorrentClient,
  makeRTorrentProvider
} from "../../../providers/rtorrent";
import HttpDigest from "lib/http_digest";

const ftp = require("basic-ftp");
var Client = require("ssh2").Client;
// use node's axios and http req so we skip self signed certs on IP only seedboxes
let axios = require("axios");

const checkForDigestAuth = async url => {
  let resp = null;
  try {
    await axios.get(url);
  } catch (e) {
    let suspect_headers = ["www-authenticate"];
    if (
      e.request.getAllResponseHeaders().search("Digest") !== -1 &&
      e.request.getAllResponseHeaders().search("realm") !== -1
    )
      return [null, true];

    // There are many things that can go wrong with this test. So we will squelch errors
    return [null, false];
  }

  return [null, false];
};

const checkRTorrentConnection = async config => {
  let provider = new makeRTorrentProvider(config);
  let [err, value] = await provider.callMethod("system.client_version");
  if (err) {
    warn(err);
    return [err, "Error:" + err];
  } else {
    return [false, "Connected to ruTorrent. rtorrent version: " + value];
  }
};
export const checkRTorrentConfig = async config => {
  let [digest_error, digest_flag] = await checkForDigestAuth(config.url);

  if (digest_flag && config.auth === "basic") {
    return [true, "Appears to use digest auth, not basic."];
  } else if (!digest_flag && config.auth === "digest") {
    return [true, "Does not appear to be digest auth"];
  }

  return await checkRTorrentConnection(config);
};

export const checkFtpConfig = async config => {
  const client = new ftp.Client();
  // client.ftp.verbose = true;

  let ftpConfig = config.download.ftp;

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    await client.access({
      host: ftpConfig.host,
      user: ftpConfig.username,
      password: ftpConfig.password,
      port: ftpConfig.port,
      secure: ftpConfig.protocol === "ftp-ssl",
      secureOptions: {
        rejectUnauthorized: false
      }
    });

    // ensure folder exists
    await client.cd(ftpConfig.folder);
    return [false, "Connected successfully."];
  } catch (err) {
    return [true, "Failed to connect " + err];
  }
};

export const checkSftpConfig = config => {
  return new Promise((resolve, reject) => {
    let conn = new Client();
    let ftpConfig = config.download.ftp;
    conn.on("error", function(err) {
      resolve([true, "SFTP Error ." + err]);
    });
    conn
      .on("ready", function() {
        conn.sftp(function(err, sftp) {
          if (err) {
            resolve([true, "SFTP Error ." + err]);
            return;
          }

          sftp.readdir(ftpConfig.folder, function(err, list) {
            if (err) {
              resolve([true, "Error finding folder:" + err]);
              return;
            }
            resolve([false, "Connected successfully"]);
            conn.end();
          });
        });
      })
      .connect({
        host: ftpConfig.host,
        port: ftpConfig.port,
        username: ftpConfig.username,
        password: ftpConfig.password
      });
  });
};

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

export const checkHttpConfig = async config => {
  let httpConfig = config.download.http;
  let username = httpConfig.username;
  let password = httpConfig.password;

  let [digest_error, digest_flag] = await checkForDigestAuth(config.url);

  if (digest_flag && httpConfig.auth === "basic") {
    return [true, "Appears to use digest auth, not basic."];
  } else if (!digest_flag && httpConfig.auth === "digest") {
    return [true, "Does not appear to be digest auth"];
  }

  if (httpConfig.server_creds) {
    username = config.username;
    password = config.password;
  }

  if (httpConfig.auth === "basic") {
    try {
      let res = await axios.get(httpConfig.baseUrl, {
        auth: {
          username: username,
          password: password
        }
      });
      return [false, "Connected successfully"];
    } catch (err) {
      return [true, "Error: " + err];
    }
  } else if (httpConfig.auth === "digest") {
    try {
      let digest_builder = new HttpDigest(username, password);
      let [setup_err] = await digest_builder.setup("GET", httpConfig.baseUrl);
      if(setup_err) {
        return [true, "Auth/digest failure"];
      }
      let header = digest_builder.getHeader();

      let res = await axios.get(httpConfig.baseUrl, {
        headers: {
          Authorization: header
        }
      });
      return [false, "Connected successfully"];
    } catch (err) {
      return [true, "Error: " + err];
    }
  }
};
