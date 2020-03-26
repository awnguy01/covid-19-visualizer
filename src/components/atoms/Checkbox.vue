<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

interface StyleObject {
  borderColor: string;
}

@Component
export default class Checkbox extends Vue {
  @Prop({ default: '' }) label!: string;
  @Prop({ default: false }) checked!: boolean;
  @Prop({ default: '#FFF' }) color!: string;

  get checkStyle(): StyleObject {
    const styleObj: StyleObject = {
      borderColor: this.color
    };
    return styleObj;
  }
}
</script>

<template>
  <label class="container">
    <input
      type="checkbox"
      :checked="checked"
      @change="$emit('change', $event)"
    />
    <span class="checkmark" v-bind:style="checkStyle"> </span>
    {{ label }}
  </label>
</template>

<style lang="scss" scoped>
/* Customize the label (the container) */
.container {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.85rem;
  user-select: none;
  width: 100%;
  color: #fff;
}

/* Hide the browser's default checkbox */
.container input {
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
  margin: 0;
}

/* Create a custom checkbox */
.checkmark {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 1.25rem;
  width: 1.25rem;
  background-color: transparent;
  border-style: solid;
  margin: 0.25rem 1rem 0.25rem 0.25rem;
}

/* Style the checkmark/indicator */
.container .checkmark:after {
  content: '';
  display: block;
  width: 5px;
  height: 10px;
  margin-bottom: 2px;
  border-style: solid;
  border-color: #fff;
  border-width: 0 3px 3px 0;
  -webkit-transform: rotate(45deg);
  -ms-transform: rotate(45deg);
  transform: rotate(45deg);
}
</style>
