<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { AppFns } from '@/utils/app-functions';

interface StyleMapObject {
  backgroundColor: string;
  borderColor: string;
  color: string;
}

@Component
export default class ToggleList extends Vue {
  @Prop({ default: true })
  loading!: boolean;

  @Prop({ default: () => new Map<string, boolean>() }) toggleMap!: Map<
    string,
    boolean
  >;
  @Prop({ default: () => new Map<string, string>() }) private colorMap!: Map<
    string,
    string
  >;

  filterInputEl: HTMLInputElement | null = null;

  filterVal = '';
  focusedVal = '';

  mounted() {
    this.filterInputEl = this.$el.querySelector('input');
    !AppFns.isMobile && this.filterInputEl && this.filterInputEl.focus();
  }

  get styleMap(): Map<string, StyleMapObject> {
    const styleMap = new Map<string, StyleMapObject>();

    this.colorMap.forEach((color: string, key: string) => {
      const mappedColor: string | undefined = this.colorMap.get(key);
      const styleColor: string =
        mappedColor === undefined ? '#fff' : mappedColor;
      const styleObj: StyleMapObject = {
        backgroundColor: this.toggleMap.get(key) ? styleColor : 'transparent',
        borderColor: styleColor,
        color: this.toggleMap.get(key) ? '#FFF' : '#000'
      };
      styleMap.set(key, styleObj);
    });

    return styleMap;
  }

  get toggleKeys() {
    return Array.from(this.toggleMap.keys())
      .filter((key: string) =>
        Array.from(this.filterVal.toLocaleUpperCase()).every((letter: string) =>
          key.toLocaleUpperCase().includes(letter)
        )
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

  highlightValue(key: string) {
    this.focusedVal = key;
  }

  resetFilter() {
    this.filterVal = '';
    const toggleRef = this.$refs['toggle-list'] as HTMLUListElement;
    if (toggleRef) {
      toggleRef.scrollTop = 0;
    }
    !AppFns.isMobile && this.filterInputEl && this.filterInputEl.focus();
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
    <div v-if="loading" id="loading-list">
      <vue-loaders-ball-triangle-path />
    </div>
    <ul v-else id="toggle-list" ref="toggle-list">
      <li
        v-for="key in toggleKeys"
        :key="key"
        v-bind:style="styleMap.get(key)"
        v-bind:class="{ highlighted: focusedVal === key }"
        @click="resetFilter()"
      >
        <Checkbox
          :checked="toggleMap.get(key)"
          :label="key"
          :color="styleMap.get(key).borderColor"
          @change="toggleValue(key)"
          @focus="highlightValue(key)"
          @blur="highlightValue('')"
        ></Checkbox>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
$margin: 1rem;

#container {
  @include borderStyle();
  display: flex;
  flex-direction: column;
  margin-right: $margin;
  margin-left: $margin;
  margin-bottom: $margin;
  width: 225px;
  min-width: 225px;
  min-height: 7rem;
  max-height: 27rem;
  padding: 1rem;
}

#toggle-list {
  padding: 0;
  list-style: none;
  text-align: left;
  overflow: auto;
  margin-bottom: 0;
  scroll-behavior: smooth;

  li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0.25rem 0.25rem 0.25rem 0;
    border-radius: 2px;
    border-style: solid;
    position: relative;
  }

  li.highlighted,
  li:hover {
    opacity: 0.5;
  }
}

#loading-list {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
