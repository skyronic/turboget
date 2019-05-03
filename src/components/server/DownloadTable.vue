<template>
  <div class="p-4">
    <b-table
      small
      :items="tableData"
      :per-page="perPage"
      :current-page="currentPage"
      :fields="tableFields"
      :tbody-tr-class="rowClass"
    >
      <template slot="actions" slot-scope="data">
        <a href="#"
           @click.prevent="showFileInFinder(data.item)"
           v-if="data.item.status === 'complete'"
        >[Show File]</a>
      </template>
    </b-table>
    <b-pagination
      v-if="tableData.length > perPage"
      v-model="currentPage"
      :total-rows="tableData.length"
      :per-page="perPage"
    ></b-pagination>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn } from "util/log";
let electron = window.require("electron");
let bytes = require('bytes')

export default {
  data() {
    return {
      tableFields: {
        status: {
          sortable: true
        },
        file: {
          sortable: true,
          tdClass: "pathCell"
        },
        completed_percent: {
          label: "Complete"
        },
        size: {
          sortable: true
        },
        speed: {},
        actions: {}
      },
      currentPage: 1,
      perPage: 15
    };
  },
  methods: {
    ...mapMutations([]),
    bytes(val) {
      return bytes(parseInt(val));
    },
    rowClass (row) {
      switch(row.status) {
        case 'active':
          return "table-primary";
        case 'error':
          return "table-danger";
        case 'complete':
          return "table-success";
      }
    },
    showFileInFinder (item) {
      electron.remote.shell.showItemInFolder(item.finalPath);
    }
  },
  mounted() {

  },
  props: {

  },
  computed: {
    ...mapGetters({
      downloads: "download/readyItems"
    }),
    tableData ()  {
      return _.map(this.downloads, (d) => {
        let info = d.info;
        let file = d.info.files && d.info.files[0] || {
          length: 0,
          completedLength: 0
        };
        return {
          file: d.file,
          status: info.status,
          finalPath: file.path,
          completed_percent: parseInt(file.length) === 0 ? "" : Math.ceil((parseInt(file.completedLength) / parseInt(file.length)) * 100) + "%",
          speed: this.bytes(info.downloadSpeed) + "/s",
          size: this.bytes(file.length)
        }
      });
    }
  }
};
</script>

<style>
  .pathCell {
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 400px;
    overflow: hidden;
  }
</style>