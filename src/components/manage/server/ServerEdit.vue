<template>
  <div>
    <b-form @submit.prevent="saveConfig">
      <div class="card">
        <div class="card-header">
          Basic Configuration
        </div>
        <div class="card-body">
          <b-form-group label="Name:">
            <b-form-input v-model="config.name"></b-form-input>
          </b-form-group>
          <b-form-group label="Server Type:">
            <b-form-radio-group v-model="config.type">
              <b-form-radio value="rutorrent">ruTorrent</b-form-radio>
              <b-form-radio value="transmission" disabled
                >Transmission</b-form-radio
              >
              <b-form-radio value="deluge" disabled>Deluge</b-form-radio>
            </b-form-radio-group>
          </b-form-group>
          <b-form-group label="Download via">
          <b-form-radio-group v-model="config.download.mode">
            <b-form-radio value="http">HTTP</b-form-radio>
            <b-form-radio value="ftp">FTP</b-form-radio>
          </b-form-radio-group>
          </b-form-group>
        </div>
      </div>
      <div v-if="config.type === 'rutorrent'">
        <div class="card mt-4">
          <div class="card-header">
            ruTorrent Config
          </div>
          <div class="card-body">
            <b-form-group label="Server:">
              <b-form-input v-model="config.url"></b-form-input>
              <b-form-text>
                Typically the URL where ruTorrent is available. Please ensure this starts with "https://" <br/>
              </b-form-text>
            </b-form-group>
            <b-form-group label="Authentication">
              <b-form-radio-group v-model="config.auth">
                <b-form-radio value="basic">Basic Auth</b-form-radio>
                <b-form-radio value="digest">Digest Auth</b-form-radio>
              </b-form-radio-group>
            </b-form-group>
            <div class="row">
              <b-form-group label="Username:" class="col-md-6">
                <b-form-input v-model="config.username"></b-form-input>
              </b-form-group>
              <b-form-group label="Password:" class="col-md-6">
                <b-form-input
                  type="password"
                  v-model="config.password"
                ></b-form-input>
              </b-form-group>
            </div>
            <config-test button-text="Test ruTorrent Config" :server-config="config" test-name="rutorrent"></config-test>
          </div>
        </div>

        <div class="card mt-4" v-if="config.download.mode === 'http'">
          <div class="card-header">
            HTTP Download Setup
          </div>
          <div class="card-body">
            <b-form-group label="Base URL:">
              <b-form-input
                v-model="config.download.http.baseUrl"
              ></b-form-input>
              <b-form-text>
                The URL where your files are accessible via HTTP. For example: "https://yourusername.yourseedbox.com/files/". It can end with "/". All torrents must be accessible from this URL.
              </b-form-text>
            </b-form-group>
            <b-form-radio-group v-model="config.download.http.auth">
              <b-form-radio value="basic-server">Basic Auth [use server credentials]</b-form-radio>
              <b-form-radio value="basic-custom">Basic Auth [custom credentials]</b-form-radio>
              <b-form-radio value="digest-server">Digest</b-form-radio>
            </b-form-radio-group>
            <div v-if="config.download.http.auth === 'basic-custom'">
              <div class="row mt-3">
                <b-form-group label="Username (downloads):" class="col-md-6">
                  <b-form-input
                    v-model="config.download.http.username"
                  ></b-form-input>
                </b-form-group>
                <b-form-group label="Password (downloads):" class="col-md-6">
                  <b-form-input
                    type="password"
                    v-model="config.download.http.password"
                  ></b-form-input>
                </b-form-group>
              </div>
            </div>
            <config-test button-text="Test HTTP Config" :server-config="config" test-name="http"></config-test>
          </div>
        </div>

        <div class="card mt-4" v-if="config.download.mode === 'ftp'">
          <div class="card-header">
            FTP Download Setup
          </div>
          <div class="card-body">
            <div class="d-flex">
              <b-form-group label="Host:" class="w-50 mr-3">
                <b-form-input v-model="config.download.ftp.host"></b-form-input>
              </b-form-group>
              <b-form-group label="Port:" class="w-25">
                <b-form-input v-model="config.download.ftp.port"></b-form-input>
              </b-form-group>
            </div>
            <b-form-group label="Protocol">
              <b-form-radio-group v-model="config.download.ftp.protocol" @change="changeDefaultPort">
                <b-form-radio value="ftp">FTP</b-form-radio>
                <b-form-radio value="sftp">SFTP</b-form-radio>
                <b-form-radio value="ftp-ssl" disabled>FTP(SSL)</b-form-radio>
              </b-form-radio-group>
            </b-form-group>
            <div class="row mt-3">
              <b-form-group label="Username (FTP):" class="col-md-6">
                <b-form-input
                  v-model="config.download.ftp.username"
                ></b-form-input>
              </b-form-group>
              <b-form-group label="Password (FTP):" class="col-md-6">
                <b-form-input
                  type="password"
                  v-model="config.download.ftp.password"
                ></b-form-input>
              </b-form-group>
            </div>
            <b-form-group label="Downloads Folder:">
              <b-form-input v-model="config.download.ftp.folder"></b-form-input>
            </b-form-group>
            <config-test button-text="Test FTP Config" :server-config="config" test-name="ftp" v-if="config.download.ftp.protocol !== 'sftp' "></config-test>
            <config-test button-text="Test SFTP Config" :server-config="config" test-name="sftp" v-if="config.download.ftp.protocol === 'sftp'"></config-test>
          </div>
        </div>
      </div>
      <b-button type="submit" variant="primary" class="mt-4">Save</b-button>
    </b-form>
  </div>
</template>

<script>
  import {mapActions, mapGetters, mapMutations} from "vuex";
import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn } from "util/log";
import ConfigTest from "components/manage/server/ConfigTest";
import default_settings from 'lib/default_settings';
import {updateSettingsFile} from "lib/settings";

export default {
  data() {
    return {
      // TODO: make this a bit better
      config: _.cloneDeep(default_settings.server.items[0].config)
    };
  },
  methods: {
    ...mapMutations({
      'saveServerConfig': "server/setConfig"
    }),
    ...mapActions ({
      'serverRefresh': "server/refresh"
    }),
    saveConfig() {
      this.config.configReady = true;
      this.saveServerConfig({key: this.serverKey, config: this.config})
      updateSettingsFile();
      this.refreshConfig();

      // if server is currently in error, refresh it
      let server = mget.server.fromKey(this.serverKey);
      if(server.connState === "error")
        this.serverRefresh({key: this.serverKey, connState: "connecting"});
    },
    refreshConfig () {
      let server = mget.server.fromKey(this.serverKey);
      this.config = _.cloneDeep(server.config);
    },
    changeDefaultPort ()  {
      // TODO: this should be the other way around, anyways
      if(this.config.download.ftp.protocol  === "sftp") {
        this.config.download.ftp.port = "21"
      }
      if(this.config.download.ftp.protocol  === "ftp") {
        this.config.download.ftp.port = "22"
      }
    }
  },
  mounted() {
    this.refreshConfig();
  },
  props: {
    serverKey: String
  },
  watch: {
    serverKey() {
      this.refreshConfig();
    },
  },
  components: {
    ConfigTest
  },
  computed: {
    ...mapGetters([])
  }
};
</script>

<style></style>
