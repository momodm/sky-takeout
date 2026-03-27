import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../shared/api';
import {
  EmptyState,
  ErrorState,
  InlineNotice,
  LoadingState,
  MetricCard,
  PageHero,
  SectionTitle,
  StatusPill,
  type NoticeTone,
} from '../../shared/components';
import { appCopy } from '../../shared/copy';
import {
  dishFlavorLinesFromEntities,
  formatCurrency,
  getErrorMessage,
  normalizeImage,
} from '../../shared/utils';

interface FeedbackState {
  title: string;
  body: string;
  tone: NoticeTone;
}

function createDishForm() {
  return {
    id: undefined as number | undefined,
    name: '',
    categoryId: '',
    price: '',
    image: '',
    description: '',
    status: '1',
    flavorLines: '辣度: 微辣 | 中辣 | 重辣',
  };
}

function toFlavorPayload(lines: string) {
  return lines
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [namePart, valuesPart = ''] = line.split(':');
      const values = valuesPart
        .split('|')
        .map((item) => item.trim())
        .filter(Boolean);

      return {
        id: index + 1,
        name: namePart.trim(),
        value: JSON.stringify(values),
      };
    });
}

export function ConsoleDishesPage() {
  const queryClient = useQueryClient();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState(createDishForm());
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ['console', 'categories', 'dish-page'],
    queryFn: () => adminApi.categoryPage(1, 50, 1),
  });
  const dishesQuery = useQuery({
    queryKey: ['console', 'dishes', 'page'],
    queryFn: () => adminApi.dishPage(1, 30),
  });

  const resolvedCategoryId = form.categoryId || String(categoriesQuery.data?.records[0]?.id ?? '');

  const refreshDishes = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['console', 'dishes'] }),
      queryClient.invalidateQueries({ queryKey: ['console', 'workspace'] }),
    ]);
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadFile(file),
    onSuccess: (image) => {
      setForm((current) => ({ ...current, image }));
      setFeedback({
        title: '图片已上传',
        body: appCopy.consoleFeedback.uploadSuccess,
        tone: 'live',
      });
    },
    onError: (error) => {
      setFeedback({
        title: appCopy.consoleFeedback.uploadErrorTitle,
        body: getErrorMessage(error, '图片上传没成功，你可以继续手动填写图片 URL。'),
        tone: 'warning',
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        id: form.id,
        name: form.name,
        categoryId: Number(resolvedCategoryId),
        price: Number(form.price),
        image: form.image,
        description: form.description,
        status: Number(form.status),
        flavors: toFlavorPayload(form.flavorLines),
      };

      return form.id ? adminApi.updateDish(payload) : adminApi.saveDish(payload);
    },
    onSuccess: async () => {
      setForm(createDishForm());
      await refreshDishes();
      setFeedback({
        title: form.id ? '菜品已更新' : '菜品已新增',
        body: appCopy.consoleFeedback.saveSuccess('菜品'),
        tone: 'live',
      });
    },
    onError: (error) => {
      setFeedback({
        title: appCopy.consoleFeedback.saveErrorTitle('菜品'),
        body: getErrorMessage(error),
        tone: 'fallback',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => adminApi.dishStatus(status, id),
    onSuccess: async (_, variables) => {
      await refreshDishes();
      setFeedback({
        title: variables.status === 1 ? '菜品已上架' : '菜品已下架',
        body: appCopy.consoleFeedback.statusSuccess('菜品', variables.status === 1 ? '上架' : '下架'),
        tone: 'live',
      });
    },
    onError: (error, variables) => {
      setFeedback({
        title: appCopy.consoleFeedback.statusErrorTitle('菜品', variables.status === 1 ? '上架' : '下架'),
        body: getErrorMessage(error),
        tone: 'fallback',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteDishes([id]),
    onSuccess: async () => {
      await refreshDishes();
      setFeedback({
        title: '菜品已删除',
        body: appCopy.consoleFeedback.deleteSuccess('菜品'),
        tone: 'live',
      });
    },
    onError: (error) => {
      setFeedback({
        title: appCopy.consoleFeedback.deleteErrorTitle('菜品'),
        body: getErrorMessage(error),
        tone: 'fallback',
      });
    },
  });

  const metrics = useMemo(() => {
    const records = dishesQuery.data?.records ?? [];
    return {
      total: records.length,
      enabled: records.filter((item) => item.status === 1).length,
      withFlavor: records.filter((item) => item.flavors?.length).length,
    };
  }, [dishesQuery.data?.records]);

  const hasError = categoriesQuery.isError || dishesQuery.isError;

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Console / Dishes"
        title="菜品页优先解决录入效率、图片上传和上下架联动。"
        description="这一页把菜品新增、编辑、状态切换、删除和口味维护拆开处理，并优先走真实上传接口；如果 OSS 暂时不可用，仍然允许手动填图片地址。"
        aside={
          <div className="metrics-grid">
            <MetricCard label="菜品总数" value={metrics.total} />
            <MetricCard label="上架中" tone="support" value={metrics.enabled} />
            <MetricCard label="带口味" value={metrics.withFlavor} />
            <MetricCard label="分类数量" tone="dark" value={categoriesQuery.data?.records.length ?? 0} />
          </div>
        }
      />

      {feedback ? <InlineNotice body={feedback.body} title={feedback.title} tone={feedback.tone} /> : null}

      <div className="grid-2">
        <section className="panel section-card">
          <SectionTitle
            eyebrow="Dish Editor"
            title={form.id ? '编辑菜品' : '新增菜品'}
            description="先上传图片或补图片地址，再录入口味和价格，保存后顾客端会立刻联动到点餐页。"
          />

          <div className="stack">
            <div className="image-preview-card">
              <img alt={form.name || '菜品预览'} className="image-preview" src={normalizeImage(form.image, form.name || '菜品预览')} />
            </div>

            <div className="button-row">
              <button className="button secondary" onClick={() => uploadInputRef.current?.click()} type="button">
                {uploadMutation.isPending ? '上传中…' : '上传图片'}
              </button>
              <input
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  // 先走后端上传接口，失败时仍保留手动 URL 作为兜底方案。
                  uploadMutation.mutate(file);
                  event.target.value = '';
                }}
                ref={uploadInputRef}
                type="file"
              />
              <StatusPill tone={form.image ? 'live' : 'warning'}>
                {form.image ? '已就绪' : '待补图片'}
              </StatusPill>
            </div>

            <div className="field-grid">
              <div className="field">
                <label htmlFor="dishCategory">所属分类</label>
                <select
                  id="dishCategory"
                  onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                  value={resolvedCategoryId}
                >
                  {(categoriesQuery.data?.records ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="dishStatus">状态</label>
                <select
                  id="dishStatus"
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  value={form.status}
                >
                  <option value="1">上架</option>
                  <option value="0">下架</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="dishName">菜品名称</label>
                <input id="dishName" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name} />
              </div>
              <div className="field">
                <label htmlFor="dishPrice">价格</label>
                <input id="dishPrice" onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} value={form.price} />
              </div>
              <div className="field full">
                <label htmlFor="dishImageUrl">图片地址</label>
                <input
                  id="dishImageUrl"
                  onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
                  placeholder="如果上传不可用，可以直接粘贴图片 URL"
                  value={form.image}
                />
              </div>
              <div className="field full">
                <label htmlFor="dishDescription">描述</label>
                <textarea id="dishDescription" onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} value={form.description} />
              </div>
              <div className="field full">
                <label htmlFor="dishFlavors">口味配置</label>
                <textarea
                  id="dishFlavors"
                  onChange={(event) => setForm((current) => ({ ...current, flavorLines: event.target.value }))}
                  value={form.flavorLines}
                />
              </div>
            </div>

            <div className="button-row">
              <button className="button primary" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} type="button">
                {saveMutation.isPending ? '保存中…' : form.id ? '更新菜品' : '新增菜品'}
              </button>
              <button className="button ghost" onClick={() => setForm(createDishForm())} type="button">
                清空表单
              </button>
            </div>
          </div>
        </section>

        <section className="panel section-card">
          <SectionTitle eyebrow="Dish List" title="当前菜品" />
          {hasError ? (
            <ErrorState body="菜品或分类接口暂时不可用，请确认后端已启动。" title="菜品数据加载失败" />
          ) : dishesQuery.isLoading ? (
            <LoadingState body="正在读取菜品列表。" />
          ) : dishesQuery.data?.records.length ? (
            <div className="stack">
              {dishesQuery.data.records.map((dish) => (
                <article className="order-card" key={dish.id}>
                  <div className="row-between">
                    <div className="stack" style={{ gap: 4 }}>
                      <strong>{dish.name}</strong>
                      <span className="soft-copy">{dish.categoryName} · {formatCurrency(dish.price)}</span>
                    </div>
                    <StatusPill tone={dish.status === 1 ? 'live' : 'warning'}>
                      {dish.status === 1 ? '上架中' : '已下架'}
                    </StatusPill>
                  </div>
                  <span className="soft-copy">{dish.description || '这道菜还没有补充描述。'}</span>
                  <div className="button-row">
                    <button
                      className="button secondary small"
                      onClick={() =>
                        void adminApi.dishById(dish.id)
                          .then((detail) =>
                            setForm({
                              id: detail.id,
                              name: detail.name,
                              categoryId: String(detail.categoryId),
                              price: String(detail.price),
                              image: detail.image,
                              description: detail.description,
                              status: String(detail.status),
                              flavorLines: dishFlavorLinesFromEntities(detail.flavors),
                            }))
                          .catch((error) =>
                            setFeedback({
                              title: '菜品详情读取失败',
                              body: getErrorMessage(error),
                              tone: 'fallback',
                            }))
                      }
                      type="button"
                    >
                      编辑
                    </button>
                    <button
                      className="button ghost small"
                      onClick={() => toggleMutation.mutate({ id: dish.id, status: dish.status === 1 ? 0 : 1 })}
                      type="button"
                    >
                      {dish.status === 1 ? '下架' : '上架'}
                    </button>
                    <button className="button danger small" onClick={() => deleteMutation.mutate(dish.id)} type="button">
                      删除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState body="当前还没有菜品，先在左侧录入第一道菜。" title="菜品列表为空" />
          )}
        </section>
      </div>
    </div>
  );
}
