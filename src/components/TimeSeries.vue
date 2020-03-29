<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Chart from 'chart.js';
import CSV from 'comma-separated-values';
import Axios, { AxiosResponse } from 'axios';
import { URLStore } from '@/constants/urlStore';
import { Watch } from 'vue-property-decorator';
import { CountryCasesObject } from '@/models/CountryCasesObject';
import { AppFns } from '@/utils/app-functions';
import randomColor from 'randomcolor';

const INTERVAL = 1000 * 60 * 60;
const DEFAULT_MIN_CASES = 1000;

@Component
export default class TimeSeries extends Vue {
  timeSeriesChart?: Chart;
  dataSource: CountryCasesObject[] = [];
  dataToggleMap = new Map<string, boolean>();
  dataColorMap = new Map<string, string>();
  retrievalInterval: any;
  relevantCasesThreshold = DEFAULT_MIN_CASES;

  cachedLabels: string[] = [];
  cachedDatasets: Chart.ChartDataSets[] = [];

  created() {
    this.getDataSource();
    this.retrievalInterval = setInterval(() => {
      this.getDataSource();
    }, INTERVAL);
  }

  beforeDestroy() {
    clearInterval(this.retrievalInterval);
  }

  @Watch('dataSource')
  onDataSourceChange() {
    this.renderChart();
    this.refreshDataToggleMap();
  }

  get chartLabels(): any[] {
    return (this.timeSeriesChart && this.timeSeriesChart.data.labels) || [];
  }

  set chartLabels(labels: any[]) {
    if (this.timeSeriesChart) {
      this.timeSeriesChart.data.labels = labels;
    }
  }

  get chartDatasets(): any[] {
    return (this.timeSeriesChart && this.timeSeriesChart.data.datasets) || [];
  }

  set chartDatasets(datasets: any[]) {
    if (this.timeSeriesChart) {
      this.timeSeriesChart.data.datasets = datasets;
    }
  }

  renderChart() {
    const ctx = this.$refs['time-series-chart'] as HTMLCanvasElement;
    this.cachedDatasets = this.mapToChartDatasets(this.dataSource);

    this.cachedLabels = Array.from(this.dataSource[0].caseMap.keys());
    const data: Chart.ChartData = {
      labels: this.cachedLabels,
      datasets: this.cachedDatasets
    };
    const options: Chart.ChartOptions = {
      responsive: false,
      legend: { position: 'bottom', fullWidth: true, display: false },
      scales: {
        xAxes: [{ ticks: { fontColor: '#fff' } }],
        yAxes: [{ ticks: { fontColor: '#fff' } }]
      }
    };
    const chartConfig: Chart.ChartConfiguration = {
      type: 'line',
      data,
      options
    };
    if (this.timeSeriesChart) {
      this.timeSeriesChart.destroy();
    }
    this.timeSeriesChart = new Chart(ctx, chartConfig);
  }

  getDataSource(): void {
    Axios.get(URLStore.CONFIRMED_CASES_URL).then((res: AxiosResponse) => {
      this.dataSource = new CSV(res.data, {
        cast: false,
        header: true
      })
        .parse()
        .map((rawCasesObj: any) =>
          this.mapRawCasesDataToCountryCases(rawCasesObj)
        );
    });
  }

  refreshDataToggleMap() {
    const tmpToggleMap = new Map<string, boolean>();
    this.dataSource.forEach((casesObj: CountryCasesObject) => {
      const country: string = casesObj.countryOrRegion;
      tmpToggleMap.set(
        country,
        (this.dataToggleMap.get(country) as boolean) || false
      );
    });
    this.dataToggleMap = tmpToggleMap;
  }

  mapToChartDatasets(
    countryCasesList: CountryCasesObject[]
  ): Chart.ChartDataSets[] {
    const reducedMap = new Map<string, number[]>();
    countryCasesList.forEach((casesObj: CountryCasesObject) => {
      const country: string = casesObj.countryOrRegion;
      let dataVals: any[] = [];
      if (!reducedMap.has(country)) {
        dataVals = Array.from(casesObj.caseMap.values());
        // this.dataColorMap.set(country, AppFns.getRandomColor());
      } else {
        const origVals: number[] = reducedMap.get(country) as number[];
        dataVals = Array.from(casesObj.caseMap.values()).map(
          (caseVal: number, valIndex: number) => caseVal + origVals[valIndex]
        );
      }
      reducedMap.set(country, dataVals);
    });

    this.assignColors(Array.from(reducedMap.keys()));

    return Array.from(reducedMap.keys()).map((key: string) => ({
      label: key,
      data: reducedMap.get(key),
      hidden: !this.dataToggleMap.get(key),
      borderColor: this.dataColorMap.get(key),
      fill: false
    }));
  }

  mapRawCasesDataToCountryCases(rawCasesObj: any): CountryCasesObject {
    const caseMap = new Map<string, number>();

    Object.keys(rawCasesObj)
      .filter((key: string) => RegExp(/^\d{1,2}\/\d{1,2}\/\d{1,2}$/).test(key))
      .forEach((key: string) =>
        caseMap.set(key.trim().slice(0, -3), +rawCasesObj[key])
      );

    return {
      provinceOrState: rawCasesObj['Province/State'],
      countryOrRegion: rawCasesObj['Country/Region'],
      lat: rawCasesObj['Lat'],
      long: rawCasesObj['Long'],
      caseMap
    };
  }

  toggleDatasets(key: string) {
    const tmpToggleMap = new Map(this.dataToggleMap);
    tmpToggleMap.set(key, !this.dataToggleMap.get(key));
    this.dataToggleMap = tmpToggleMap;
    if (this.timeSeriesChart) {
      if (this.chartDatasets) {
        const dataIndex = this.chartDatasets.findIndex(
          (dataSet: Chart.ChartDataSets) => dataSet.label === key
        );
        if (dataIndex !== -1) {
          const hidden = !this.dataToggleMap.get(key);
          this.chartDatasets[dataIndex].hidden = hidden;
          this.updateChartThreshold();
        }
      }
      this.timeSeriesChart.update();
    }
  }

  @Watch('relevantCasesThreshold')
  updateChartThreshold(): void {
    const minIndex = this.getMinRelevantIndex(this.chartDatasets);

    this.chartLabels = this.cachedLabels.slice(minIndex);
    this.chartDatasets = this.cachedDatasets.map(
      (dataset: Chart.ChartDataSets) => ({
        ...dataset,
        data: (dataset.data && dataset.data.slice(minIndex)) || []
      })
    );
    this.timeSeriesChart && this.timeSeriesChart.update();
  }

  getMinRelevantIndex(dataSets: Chart.ChartDataSets[]): number {
    const visibleDatasets: Chart.ChartDataSets[] = dataSets.filter(
      (dataSet: Chart.ChartDataSets) =>
        !dataSet.hidden && dataSet.data && dataSet.data.some((val: any) => val)
    );

    if (!visibleDatasets.length) {
      return 0;
    }

    let minIndex: number = (visibleDatasets[0].data as number[]).findIndex(
      (val: number) => val > this.relevantCasesThreshold
    );

    if (minIndex === -1) {
      const longestDataset: Chart.ChartDataSets = visibleDatasets.reduce(
        (datasetA: Chart.ChartDataSets, datasetB: Chart.ChartDataSets) => {
          const lengthA = (datasetA.data && datasetA.data.length) || 0;
          const lengthB = (datasetB.data && datasetB.data.length) || 0;
          return lengthA >= lengthB ? datasetA : datasetB;
        }
      );
      minIndex = (longestDataset.data && longestDataset.data.length) || 0;
    }

    visibleDatasets.slice(1).forEach((dataset: Chart.ChartDataSets) => {
      if (dataset.data) {
        for (let i = 0; i < minIndex; i++) {
          if ((dataset.data[i] as number) > this.relevantCasesThreshold) {
            minIndex = i;
            break;
          }
        }
      }
    });

    return minIndex;
  }

  assignColors(keys: string[]) {
    const colors = randomColor({
      count: keys.length,
      luminosity: 'dark'
    });
    keys.forEach((key: string, index: number) => {
      this.dataColorMap.set(key, colors[index]);
    });
  }
}
</script>

<template>
  <div id="time-series">
    <span class="input-field">
      Minimum Threshold&nbsp;
      <input type="number" v-model="relevantCasesThreshold" />
    </span>
    <div id="content">
      <ToggleList
        :toggleMap="dataToggleMap"
        :colorMap="dataColorMap"
        @toggleChange="toggleDatasets($event)"
      ></ToggleList>
      <canvas ref="time-series-chart" height="400" width="425"></canvas>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#time-series {
  display: flex;
  justify-content: center;
  flex-direction: column;
}

#content {
  display: flex;
  justify-content: center;
}

.input-field {
  margin-bottom: 1rem;
  input {
    width: 4.5rem;
  }
}
</style>
