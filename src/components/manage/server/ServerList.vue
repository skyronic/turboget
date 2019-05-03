<template>
  <div class="d-flex flex-column h-100">
    <b-list-group class="flex-grow-1 border-default border">
      <b-list-group-item href="#" active v-for="s in servers" :key="s.key">
        {{ s.config.name }}
      </b-list-group-item>
    </b-list-group>
    <div class="mt-2">
      <b-button class="float-right" disabled>Add Server</b-button>
    </div>
  </div>
</template>

<script>
  import { mapGetters, mapMutations } from "vuex";
  import _ from "lodash";
  import mget from "util/mget";
  import { info, debug, warn } from "util/log";

  export default {
    data() {
      return {

      };
    },
    methods: {
      ...mapMutations([])
    },
    mounted() {

    },
    props: {

    },
    computed: {
      ...mapGetters({
        servers: 'server/items'
      })
    }
  };
</script>

<style>

</style>