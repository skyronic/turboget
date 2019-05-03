<template>
  <div class="d-flex align-items-stretch h-100">
    <div class="w-25 p-4 border-right border h-100">
      <server-list></server-list>
    </div>
    <div class="editFormContainer w-75 h-100 p-4 bg-light">
      <server-edit server-key="default"></server-edit>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import _ from "lodash";
import mget from "util/mget";
import { info, debug, warn } from "util/log";
import ServerEdit from "components/manage/server/ServerEdit";
import ServerList from "components/manage/server/ServerList";

export default {
  data() {
    return {

    };
  },
  components: {
    ServerEdit,
    ServerList,
  },
  methods: {
    ...mapMutations([])
  },
  mounted() {

  },
  props: {

  },
  computed: {
    ...mapGetters([])
  }
};
</script>

<style>
  .pageContainer {
  }
  .editFormContainer {
    overflow-y:scroll;
  }
</style>