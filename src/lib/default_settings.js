let remote = window.require("electron").remote;
let app = remote.app;
export default {
  library: {
    items: [
      {
        key: "default",
        config: {
          configReady: false,
          name: "Default Library",
          target: app.getPath("downloads")
        }
      }
    ]
  },
  server: {
    items: [
      {
        key: "default",
        config: {
          configReady: false,
          name: "Default Seedbox",
          type: "rutorrent",
          url: "",
          username: "",
          password: "",
          auth: "basic",
          download: {
            mode: "http",
            http: {
              baseUrl: "",
              auth: "basic",
              server_creds: false,
              username: "",
              password: ""
            },
            ftp: {
              host: "",
              port: "22",
              protocol: "ftp",
              username: "",
              password: "",
              folder: ""
            }
          }
        }
      }
    ]
  }
};
