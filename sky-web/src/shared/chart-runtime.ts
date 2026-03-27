import type { BarSeriesOption, LineSeriesOption, PieSeriesOption } from 'echarts/charts';
import type {
  DatasetComponentOption,
  GridComponentOption,
  LegendComponentOption,
  TooltipComponentOption,
} from 'echarts/components';
import type { ComposeOption, ECharts } from 'echarts/core';

export type AppChartOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | GridComponentOption
  | LegendComponentOption
  | TooltipComponentOption
  | DatasetComponentOption
>;

type EChartsCoreModule = typeof import('echarts/core');
type InitOptions = Parameters<EChartsCoreModule['init']>[2];

let runtimePromise: Promise<EChartsCoreModule> | null = null;

async function loadRuntime() {
  if (!runtimePromise) {
    runtimePromise = (async () => {
      const [core, charts, components, renderers] = await Promise.all([
        import('echarts/core'),
        import('echarts/charts'),
        import('echarts/components'),
        import('echarts/renderers'),
      ]);

      core.use([
        charts.BarChart,
        charts.LineChart,
        charts.PieChart,
        components.DatasetComponent,
        components.GridComponent,
        components.LegendComponent,
        components.TooltipComponent,
        renderers.CanvasRenderer,
      ]);

      return core;
    })();
  }

  return runtimePromise;
}

export async function initChart(element: HTMLDivElement, theme?: string, opts?: InitOptions): Promise<ECharts> {
  const core = await loadRuntime();
  return core.init(element, theme, opts);
}
