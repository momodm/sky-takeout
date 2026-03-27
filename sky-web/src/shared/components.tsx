import { useEffect, useId, useRef, type ReactNode } from 'react';
import type { EChartsOption } from 'echarts';

export type NoticeTone = 'default' | 'live' | 'fallback' | 'warning';

interface PageHeroProps {
  eyebrow: string;
  eyebrowTone?: 'accent' | 'support' | 'warning';
  title: string;
  description: string;
  actions?: ReactNode;
  aside?: ReactNode;
}

interface SectionTitleProps {
  eyebrow?: string;
  eyebrowTone?: 'accent' | 'support' | 'warning';
  title: string;
  description?: string;
  actions?: ReactNode;
}

interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'support' | 'dark';
}

interface NoticeProps {
  title: string;
  body: string;
  tone?: NoticeTone;
  actions?: ReactNode;
}

interface StatusPillProps {
  children: ReactNode;
  tone?: 'default' | 'live' | 'demo' | 'warning' | 'danger';
}

interface ChartCardProps {
  eyebrow?: string;
  title: string;
  description?: string;
  option: EChartsOption;
  height?: number;
  actions?: ReactNode;
}

export function PageHero({
  eyebrow,
  eyebrowTone = 'accent',
  title,
  description,
  actions,
  aside,
}: PageHeroProps) {
  return (
    <section className="hero-card panel">
      <div className="hero-grid">
        <div className="hero-copy">
          <span className={`eyebrow${eyebrowTone === 'accent' ? '' : ` ${eyebrowTone}`}`}>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          {actions ? <div className="hero-actions">{actions}</div> : null}
        </div>
        {aside ? <div className="stack">{aside}</div> : null}
      </div>
    </section>
  );
}

export function SectionTitle({
  eyebrow,
  eyebrowTone = 'accent',
  title,
  description,
  actions,
}: SectionTitleProps) {
  return (
    <div className="table-card-header">
      <div className="stack">
        {eyebrow ? (
          <span className={`eyebrow${eyebrowTone === 'accent' ? '' : ` ${eyebrowTone}`}`}>{eyebrow}</span>
        ) : null}
        <div className="stack" style={{ gap: 6 }}>
          <h2 className="section-title">{title}</h2>
          {description ? <p className="section-intro">{description}</p> : null}
        </div>
      </div>
      {actions}
    </div>
  );
}

export function MetricCard({ label, value, hint, tone = 'default' }: MetricCardProps) {
  const toneClass = tone === 'default' ? '' : ` ${tone}`;
  return (
    <article className={`metric-card${toneClass}`}>
      <p className="label">{label}</p>
      <p className="value">{value}</p>
      {hint ? <p className="hint">{hint}</p> : null}
    </article>
  );
}

export function InlineNotice({ title, body, tone = 'default', actions }: NoticeProps) {
  return (
    <div
      aria-live="polite"
      className={`notice${tone === 'default' ? '' : ` ${tone}`}`}
      role="status"
    >
      <div className="notice-body">
        <strong>{title}</strong>
        <span>{body}</span>
      </div>
      {actions ? <div className="notice-actions">{actions}</div> : null}
    </div>
  );
}

export function StatusPill({ children, tone = 'default' }: StatusPillProps) {
  return <span className={`status-pill${tone === 'default' ? '' : ` ${tone}`}`}>{children}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span className="soft-copy">{body}</span>
      {action}
    </div>
  );
}

export function ErrorState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty-state error-state" role="alert">
      <strong>{title}</strong>
      <span className="soft-copy">{body}</span>
      {action}
    </div>
  );
}

export function LoadingState({ title = '正在加载数据', body = '稍等一下，前端正在和后端同步。' }) {
  return (
    <div aria-live="polite" className="loading-state" role="status">
      <strong>{title}</strong>
      <span className="soft-copy">{body}</span>
      <div className="loading-bar" />
      <div className="loading-bar" />
    </div>
  );
}

export function ChartCard({
  eyebrow,
  title,
  description,
  option,
  height = 300,
  actions,
}: ChartCardProps) {
  return (
    <section className="chart-card scroll-panel">
      <SectionTitle actions={actions} description={description} eyebrow={eyebrow} eyebrowTone="support" title={title} />
      <EChart option={option} height={height} />
    </section>
  );
}

export function AvatarChip({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="avatar-chip">
      <span className="avatar-dot" />
      <div className="stack" style={{ gap: 2 }}>
        <strong>{title}</strong>
        <span className="inline-meta">{subtitle}</span>
      </div>
    </div>
  );
}

export function EChart({ option, height = 300 }: { option: EChartsOption; height?: number }) {
  const chartId = useId();
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    let disposed = false;
    let cleanup = () => {};

    void import('echarts').then((module) => {
      if (disposed) {
        return;
      }

      const chart = module.init(element, undefined, { renderer: 'canvas' });
      chart.setOption(option);

      const resizeObserver = new ResizeObserver(() => {
        chart.resize();
      });
      resizeObserver.observe(element);

      cleanup = () => {
        resizeObserver.disconnect();
        chart.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [chartId, option]);

  return <div className="chart-shell" ref={elementRef} style={{ height }} />;
}
