<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Chart from 'chart.js';
import { Watch, Prop } from 'vue-property-decorator';
import randomColor from 'randomcolor';

@Component
export default class TimeSeries extends Vue {
  @Prop({ default: true })
  loading!: boolean;

  @Prop({ default: () => new Map() })
  dataMap!: Map<string, number[]>;

  @Prop({ default: () => [] })
  dataLabels!: string[];

  @Prop({ default: 0 })
  relevantCasesThreshold!: number;

  timeSeriesChart?: Chart;
  dataToggleMap = new Map<string, boolean>();
  dataColorMap = new Map<string, string>();
  retrievalInterval: any;

  cachedDatasets: Chart.ChartDataSets[] = [];

  helpMsg = 'Increase this to narrow the displayed data';

  beforeDestroy() {
    clearInterval(this.retrievalInterval);
  }

  @Watch('dataMap')
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
    this.cachedDatasets = this.mapToChartDatasets(this.dataMap);

    const data: Chart.ChartData = {
      labels: this.dataLabels,
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

    if (ctx) {
      this.timeSeriesChart = new Chart(ctx, chartConfig);
    }
  }

  refreshDataToggleMap() {
    const tmpToggleMap = new Map<string, boolean>();
    this.dataMap.forEach((_, key: string) => {
      tmpToggleMap.set(key, (this.dataToggleMap.get(key) as boolean) || false);
    });
    this.dataToggleMap = tmpToggleMap;
  }

  mapToChartDatasets(dataMap: Map<string, number[]>): Chart.ChartDataSets[] {
    this.assignColors(Array.from(dataMap.keys()));

    return Array.from(dataMap.keys()).map((key: string) => ({
      label: key,
      data: dataMap.get(key),
      hidden: !this.dataToggleMap.get(key),
      borderColor: this.dataColorMap.get(key),
      fill: false
    }));
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

    this.chartLabels = this.dataLabels.slice(minIndex);
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
    <div id="content">
      <ToggleList
        :toggleMap="dataToggleMap"
        :colorMap="dataColorMap"
        :loading="loading"
        @toggleChange="toggleDatasets($event)"
      ></ToggleList>

      <div id="chart-section">
        <vue-loaders-ball-triangle-path v-if="loading" />
        <span v-else class="input-field">
          <span>Minimum Threshold&nbsp;</span>
          <input type="number" v-model="relevantCasesThreshold" />
          <span class="tooltip-bottom" :data-tooltip="helpMsg">
            <i class="material-icons">help_outline</i>
          </span>
        </span>

        <canvas
          id="timeSeriesCanvas"
          ref="time-series-chart"
          height="400"
          width="425"
          v-bind:style="{ display: loading ? 'none' : 'block' }"
        ></canvas>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#time-series {
  display: flex;
  justify-content: center;
  flex-direction: column;
}

#timeSeriesCanvas {
  margin: 1rem;
}

#content {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

#chart-section {
  @include borderStyle();
  height: 29rem;
  width: 425px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.input-field {
  display: flex;
  justify-content: center;
  align-items: center;

  input {
    width: 4.5rem;
  }
  * {
    margin-left: 0.25rem;
    margin-right: 0.25rem;
  }
}
</style>
