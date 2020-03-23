<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';

@Component
export default class ToggleList extends Vue {
  @Prop({ default: new Map() }) toggleMap!: Map<string, boolean>;
  filterVal = '';

  get toggleKeys() {
    return Array.from(this.toggleMap.keys())
      .filter((key: string) =>
        key.toUpperCase().includes(this.filterVal.toUpperCase())
      )
      .sort((keyA: string, keyB: string) => {
        const checkedA: number = this.toggleMap.get(keyA) ? 1 : 0;
        const checkedB: number = this.toggleMap.get(keyB) ? 1 : 0;
        const compare = checkedB - checkedA;
        return compare || keyA.localeCompare(keyB);
      });
  }

  toggleValue(key: string) {
    this.$emit('toggleChange', key);
  }
}
</script>

<template>
  <div id="container">
    <input
      type="text"
      name="search"
      placeholder="Filter list..."
      v-model.trim="filterVal"
    />
    <ul id="toggle-list">
      <li v-for="key in toggleKeys" :key="key">
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
#container {
  display: flex;
  flex-direction: column;
  margin-right: 1rem;
}

#toggle-list {
  padding: 0;
  list-style: none;
  text-align: left;
  max-height: 360px;
  overflow: auto;
}
</style>
