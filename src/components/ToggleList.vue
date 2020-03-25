<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';

interface StyleMapObject {
  backgroundColor: string;
  borderColor: string;
  color: string;
}

@Component
export default class ToggleList extends Vue {
  @Prop({ default: () => new Map<string, boolean>() }) toggleMap!: Map<
    string,
    boolean
  >;
  @Prop({ default: () => new Map<string, string>() }) private colorMap!: Map<
    string,
    string
  >;

  filterVal = '';

  get styleMap(): Map<string, StyleMapObject> {
    const styleMap = new Map<string, StyleMapObject>();

    this.colorMap.forEach((color: string, key: string) => {
      const mappedColor: string = this.colorMap.get(key) || '#FFF';
      const styleObj: StyleMapObject = {
        backgroundColor: this.toggleMap.get(key) ? mappedColor : '#FFF',
        borderColor: mappedColor,
        color: this.toggleMap.get(key) ? '#FFF' : '#000'
      };
      styleMap.set(key, styleObj);
    });

    return styleMap;
  }

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
      <li v-for="key in toggleKeys" :key="key" v-bind:style="styleMap.get(key)">
        <span>
          <input
            type="checkbox"
            :name="key"
            :checked="toggleMap.get(key)"
            @change="toggleValue(key)"
          />
          <label :for="key">
            {{ key }}
          </label>
        </span>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
#container {
  display: flex;
  flex-direction: column;
  margin-right: 1rem;
  width: 225px;
  min-width: 225px;
}

#toggle-list {
  padding: 0;
  list-style: none;
  text-align: left;
  max-height: 360px;
  overflow: auto;

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0.25rem 0.25rem 0.25rem 0;
    border-radius: 2px;
    border-style: solid;
  }
}
</style>
