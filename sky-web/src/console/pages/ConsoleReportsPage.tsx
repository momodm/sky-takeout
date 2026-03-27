import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { EChartsOption } from 'echarts';
import { adminApi } from '../../shared/api';
import { ChartCard, ErrorState, InlineNotice, MetricCard, PageHero } from '../../shared/components';
import {
  downloadBlob,
  formatCurrency,
  formatNumber,
  nextSevenDaysRange,
  toChartPoints,
} from '../../shared/utils';

export function ConsoleReportsPage() {
  const initialRange = nextSevenDaysRange();
  const [begin, setBegin] = useState(initialRange.begin);
  const [end, setEnd] = useState(initialRange.end);

  const turnoverQuery = useQuery({
    queryKey: ['console', 'reports', 'turnover', begin, end],
    queryFn: () => adminApi.turnoverReport(begin, end),
  });
  const userQuery = useQuery({
    queryKey: ['console', 'reports', 'user', begin, end],
    queryFn: () => adminApi.userReport(begin, end),
  });
  const ordersQuery = useQuery({
    queryKey: ['console', 'reports', 'orders', begin, end],
    queryFn: () => adminApi.ordersReport(begin, end),
  });
  const top10Query = useQuery({
    queryKey: ['console', 'reports', 'top10', begin, end],
    queryFn: () => adminApi.top10Report(begin, end),
  });

  const exportMutation = useMutation({
    mutationFn: () => adminApi.exportReport(),
    onSuccess: (blob) => {
      downloadBlob(blob, `sky-report-${begin}-${end}.xlsx`);
    },
  });
  const hasError = turnoverQuery.isError || userQuery.isError || ordersQuery.isError || top10Query.isError;

  const turnoverOption = useMemo<EChartsOption>(() => {
    const points = toChartPoints(turnoverQuery.data?.dateList, turnoverQuery.data?.turnoverList);
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: points.map((item) => item.label) },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'line',
          smooth: true,
          data: points.map((item) => item.value),
          color: '#ca5f2d',
          areaStyle: { color: 'rgba(202, 95, 45, 0.18)' },
        },
      ],
    };
  }, [turnoverQuery.data?.dateList, turnoverQuery.data?.turnoverList]);

  const userOption = useMemo<EChartsOption>(() => {
    const labels = (userQuery.data?.dateList || '').split(',').filter(Boolean);
    const newUsers = (userQuery.data?.newUserList || '').split(',').map(Number);
    const totalUsers = (userQuery.data?.totalUserList || '').split(',').map(Number);
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['新增用户', '累计用户'] },
      xAxis: { type: 'category', data: labels },
      yAxis: { type: 'value' },
      series: [
        { type: 'bar', name: '新增用户', data: newUsers, color: '#1e6f63' },
        { type: 'line', name: '累计用户', data: totalUsers, color: '#ca5f2d' },
      ],
    };
  }, [userQuery.data?.dateList, userQuery.data?.newUserList, userQuery.data?.totalUserList]);

  const top10Option = useMemo<EChartsOption>(() => {
    const labels = (top10Query.data?.nameList || '').split(',').filter(Boolean);
    const values = (top10Query.data?.numberList || '').split(',').map(Number);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: labels },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: { color: '#d29221', borderRadius: [0, 12, 12, 0] },
        },
      ],
    };
  }, [top10Query.data?.nameList, top10Query.data?.numberList]);

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Console / Reports"
        title="报表页把趋势、排行和导出收成同一条经营分析路径"
        description="这一页继续沿用 Day 10 的后端接口，但前端会把曲线、排行和导出操作收成更像产品化报表中心。"
        actions={
          <div className="button-row">
            <div className="field">
              <label htmlFor="reportBegin">开始日期</label>
              <input id="reportBegin" onChange={(event) => setBegin(event.target.value)} type="date" value={begin} />
            </div>
            <div className="field">
              <label htmlFor="reportEnd">结束日期</label>
              <input id="reportEnd" onChange={(event) => setEnd(event.target.value)} type="date" value={end} />
            </div>
            <button className="button primary" onClick={() => exportMutation.mutate()} type="button">
              导出 Excel
            </button>
          </div>
        }
        aside={
          <div className="metrics-grid">
            <MetricCard label="总订单数" value={formatNumber(ordersQuery.data?.totalOrderCount)} />
            <MetricCard label="有效订单数" tone="support" value={formatNumber(ordersQuery.data?.validOrderCount)} />
            <MetricCard label="订单完成率" value={`${Number(ordersQuery.data?.orderCompletionRate ?? 0).toFixed(2)}%`} />
            <MetricCard label="导出状态" tone="dark" value={exportMutation.isPending ? '导出中' : '可导出'} />
          </div>
        }
      />

      {exportMutation.isError ? (
        <InlineNotice
          body="导出接口没成功，但趋势和排行仍然可以继续查看。"
          title="导出失败，请确认后端服务和文件流接口正常"
          tone="warning"
        />
      ) : null}

      {hasError ? (
        <ErrorState
          body="报表接口暂时不可用，请先确认后端 8080 已启动，并检查订单与用户统计数据是否已准备完成。"
          title="报表中心加载失败"
        />
      ) : (
        <>
          <div className="grid-2">
            <ChartCard description="营业额统计折线图。" eyebrow="Turnover" option={turnoverOption} title="营业额趋势" />
            <ChartCard description="新增用户和累计用户并排观察。" eyebrow="Users" option={userOption} title="用户增长" />
          </div>

          <div className="grid-2">
            <ChartCard description="销量前十直接来自 top10 接口。" eyebrow="Top 10" option={top10Option} title="销量前十" />
            <section className="panel section-card">
              <div className="stack">
                <span className="eyebrow support">Report Summary</span>
                <h2 className="section-title">本周期摘要</h2>
                <div className="metrics-grid">
                  <MetricCard label="订单总量" value={formatNumber(ordersQuery.data?.totalOrderCount)} />
                  <MetricCard label="有效订单" tone="support" value={formatNumber(ordersQuery.data?.validOrderCount)} />
                  <MetricCard label="完成率" value={`${Number(ordersQuery.data?.orderCompletionRate ?? 0).toFixed(2)}%`} />
                  <MetricCard label="最新营业额" tone="dark" value={formatCurrency((turnoverQuery.data?.turnoverList || '0').split(',').at(-1) || 0)} />
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
