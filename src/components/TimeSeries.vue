<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Chart from 'chart.js';
import CSV from 'comma-separated-values';
import Axios, { AxiosResponse } from 'axios';
import { URLStore } from '@/constants/urlStore';
import { Watch } from 'vue-property-decorator';
import { CountryCasesObject } from '@/models/CountryCasesObject';

@Component
export default class TimeSeries extends Vue {
  timeSeriesChart?: Chart;
  dataSource: CountryCasesObject[] = [];
  dataToggleMap = new Map<string, boolean>();

  created() {
    Axios.get(URLStore.CONFIRMED_CASES_URL).then((res: AxiosResponse) => {
      this.dataSource = this.generateDataSource(res.data);
    });
  }

  @Watch('dataSource')
  onRawDataSourceChange() {
    this.renderChart();
    this.refreshDataToggleMap();
  }

  renderChart() {
    const ctx = this.$refs['time-series-chart'] as HTMLCanvasElement;
    const datasets: Chart.ChartDataSets[] = this.mapToChartDatasets(
      this.dataSource
    );
    const labels: string[] = Array.from(this.dataSource[0].caseMap.keys());
    const data: Chart.ChartData = { labels, datasets };
    const options: Chart.ChartOptions = {
      responsive: false,
      legend: { position: 'bottom', fullWidth: true, display: false }
    };
    const chartConfig: Chart.ChartConfiguration = {
      type: 'line',
      data,
      options
    };
    this.timeSeriesChart = new Chart(ctx, chartConfig);
  }

  generateDataSource(rawCSV: string): CountryCasesObject[] {
    return new CSV(rawCSV, {
      cast: false,
      header: true
    })
      .parse()
      .map((rawCasesObj: any) =>
        this.mapRawCasesDataToCountryCases(rawCasesObj)
      );
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
      } else {
        const origVals: number[] = reducedMap.get(country) as number[];
        dataVals = Array.from(casesObj.caseMap.values()).map(
          (caseVal: number, valIndex: number) => caseVal + origVals[valIndex]
        );
      }
      reducedMap.set(country, dataVals);
    });

    return Array.from(reducedMap.keys()).map((key: string) => ({
      label: key,
      data: reducedMap.get(key),
      hidden: !this.dataToggleMap.get(key)
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
    this.dataToggleMap.set(key, !this.dataToggleMap.get(key));
    if (this.timeSeriesChart) {
      if (this.timeSeriesChart.data.datasets) {
        const dataIndex = this.timeSeriesChart.data.datasets.findIndex(
          (dataSet: Chart.ChartDataSets) => dataSet.label === key
        );
        const hidden = !this.dataToggleMap.get(key);
        this.timeSeriesChart.data.datasets[dataIndex].hidden = hidden;
      }
      this.timeSeriesChart.update();
    }
  }
}
</script>

<template>
  <div id="time-series">
    <ToggleList
      :toggleMap="dataToggleMap"
      @toggleChange="toggleDatasets($event)"
    ></ToggleList>
    <canvas ref="time-series-chart" height="400" width="500"></canvas>
  </div>
</template>

<style lang="scss" scoped>
#time-series {
  display: flex;
  justify-content: center;
}
</style>
