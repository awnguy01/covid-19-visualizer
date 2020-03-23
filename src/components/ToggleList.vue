<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';

@Component
export default class ToggleList extends Vue {
  @Prop({ default: new Map() }) toggleMap!: Map<string, boolean>;

  toggleKeys: string[] = [];

  toggleValue(key: string) {
    this.$emit('toggleChange', key);
  }
}
</script>

<template>
  <div>
    <ul id="toggle-list">
      <li v-for="key in toggleMap.keys()" :key="key">
        <input
          type="checkbox"
          :name="key"
          :checked="toggleMap.get(key)"
          @change="toggleValue(key)"
        />
        <label :for="key">{{ key }}</label>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
#toggle-list {
  list-style: none;
  text-align: left;
}
</style>
