<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { CasesDataService } from '@/http/CasesDataService';
import { CountryCasesObject } from '@/models/CountryCasesObject';
import { DailyReportObject } from '../models/DailyReportObject';
import { STATE_SET } from '@/constants/states';

const INTERVAL = 1000 * 60 * 60;

@Component
export default class StatesVisualizer extends Vue {
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
    CasesDataService.dailyCasesReports.then(
      (dailyReportListGroups: DailyReportObject[][]) => {
        const stateCasesMap = new Map<string, number[]>(
          Array.from(STATE_SET).map((state: string) => [state, []])
        );

        dailyReportListGroups.forEach(
          (dailyRepList: DailyReportObject[], dayIndex: number) => {
            dailyRepList.forEach((dailyRepObj: DailyReportObject) => {
              const state: string = dailyRepObj.provinceOrState;
              if (stateCasesMap.has(state)) {
                const casesList: number[] = stateCasesMap.get(state) || [];
                casesList[dayIndex] =
                  casesList[dayIndex] || casesList[dayIndex - 1] || 0;
                casesList[dayIndex] += +dailyRepObj.confirmed;
                stateCasesMap.set(state, casesList);
              }
            });

            const currDayCount = dayIndex + 1;

            Array.from(stateCasesMap.keys()).forEach((key: string) => {
              const casesList: number[] = stateCasesMap.get(key) || [];
              if (casesList.length < currDayCount) {
                for (let i = 0; i < currDayCount - casesList.length; i++) {
                  casesList.push(0);
                }
                stateCasesMap.set(key, casesList);
              }
            });
          }
        );

        this.labels = dailyReportListGroups.map(
          (dailyRepList: DailyReportObject[]) =>
            dailyRepList[0].date.replace(/(^0){1}/, '')
        );

        this.dataSource = stateCasesMap;
        this.loading = false;
      }
    );
  }

  convertDataListToMap(casesList: CountryCasesObject[]): Map<string, number[]> {
    const reducedMap = new Map<string, number[]>();
    casesList.forEach((casesObj: CountryCasesObject) => {
      reducedMap.set(
        casesObj.provinceOrState,
        Array.from(casesObj.caseMap.values())
      );
    });

    return reducedMap;
  }
}
</script>

<template>
  <div>
    <h1>
      COVID-19 Confirmed Cases By US States Over Time
    </h1>
    <TimeSeries
      :dataMap="dataSource"
      :dataLabels="labels"
      :relevantCasesThreshold="0"
      :loading="loading"
    ></TimeSeries>
  </div>
</template>
