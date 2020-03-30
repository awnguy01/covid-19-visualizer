<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { CasesDataService } from '@/http/CasesDataService';
import { CountryCasesObject } from '../models/CountryCasesObject';

const INTERVAL = 1000 * 60 * 60;

@Component
export default class CountriesVisualizer extends Vue {
  loading = true;
  dataSource = new Map<string, number[]>();
  labels: string[] = [];
  retrievalInterval: any;

  created() {
    this.updateLocalDataSource();
    this.retrievalInterval = setInterval(() => {
      this.updateLocalDataSource();
    }, INTERVAL);
  }

  beforeDestroy() {
    clearInterval(this.retrievalInterval);
  }

  updateLocalDataSource(): void {
    this.loading = true;
    CasesDataService.confirmedCases.then((casesList: CountryCasesObject[]) => {
      if (casesList.length) {
        this.labels = Array.from(casesList[0].caseMap.keys());
        this.dataSource = this.convertDataListToMap(casesList);
      }
      this.loading = false;
    });
  }

  convertDataListToMap(casesList: CountryCasesObject[]): Map<string, number[]> {
    const reducedMap = new Map<string, number[]>();
    casesList.forEach((casesObj: CountryCasesObject) => {
      const country: string = casesObj.countryOrRegion;
      let dataVals: any[] = [];
      if (!reducedMap.has(country)) {
        dataVals = Array.from(casesObj.caseMap.values());
      } else {
        const origVals: number[] = reducedMap.get(country) as number[];
        dataVals = Array.from(casesObj.caseMap.values()).map(
          (caseVal: number, valIndex: number) => caseVal + origVals[valIndex]
        );
      }
      reducedMap.set(country, dataVals);
    });

    return reducedMap;
  }
}
</script>

<template>
  <div>
    <h1>
      COVID-19 Confirmed Cases By Country Over Time
    </h1>
    <TimeSeries
      :dataMap="dataSource"
      :dataLabels="labels"
      :relevantCasesThreshold="1000"
      :loading="loading"
    ></TimeSeries>
  </div>
</template>
