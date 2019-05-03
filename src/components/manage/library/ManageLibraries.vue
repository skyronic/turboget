<template>
  <div class="d-flex align-items-stretch h-100">
    <div class="w-25 p-4 border-right border h-100">
      <library-list></library-list>
    </div>
    <div class="editFormContainer w-75 h-100 p-4 bg-light">
      <library-edit library-key="default"></library-edit>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import LibraryList from "components/manage/library/LibraryList";
import LibraryEdit from "components/manage/library/LibraryEdit";

export default {
  data() {
    return {

    };
  },
  components: {
    LibraryEdit,
    LibraryList
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
  .editFormContainer {
    overflow-y:scroll;
  }
</style>