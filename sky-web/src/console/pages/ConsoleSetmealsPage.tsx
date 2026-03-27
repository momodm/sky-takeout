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
} from '../../shared/components';
import { formatCurrency, normalizeImage } from '../../shared/utils';

function createSetmealForm() {
  return {
    id: undefined as number | undefined,
    categoryId: '',
    name: '',
    price: '',
    image: '',
    description: '',
    status: '1',
    dishRows: [{ dishId: '', copies: '1' }],
  };
}

export function ConsoleSetmealsPage() {
  const queryClient = useQueryClient();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState(createSetmealForm());

  const categoriesQuery = useQuery({
    queryKey: ['console', 'categories', 'setmeal-page'],
    queryFn: () => adminApi.categoryPage(1, 50, 2),
  });
  const setmealsQuery = useQuery({
    queryKey: ['console', 'setmeals', 'page'],
    queryFn: () => adminApi.setmealPage(1, 30),
  });
  const dishesQuery = useQuery({
    queryKey: ['console', 'dishes', 'for-setmeal'],
    queryFn: () => adminApi.dishPage(1, 100),
  });

  const resolvedCategoryId = form.categoryId || String(categoriesQuery.data?.records[0]?.id ?? '');

  const refreshSetmeals = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['console', 'setmeals'] }),
      queryClient.invalidateQueries({ queryKey: ['console', 'workspace'] }),
    ]);
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadFile(file),
    onSuccess: (image) => {
      setForm((current) => ({ ...current, image }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        id: form.id,
        categoryId: Number(resolvedCategoryId),
        name: form.name,
        price: Number(form.price),
        image: form.image,
        description: form.description,
        status: Number(form.status),
        setmealDishes: form.dishRows
          .filter((row) => row.dishId)
          .map((row) => ({
            dishId: Number(row.dishId),
            copies: Number(row.copies || 1),
          })),
      };

      return form.id ? adminApi.updateSetmeal(payload) : adminApi.saveSetmeal(payload);
    },
    onSuccess: async () => {
      setForm(createSetmealForm());
      await refreshSetmeals();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => adminApi.setmealStatus(status, id),
    onSuccess: refreshSetmeals,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteSetmeals([id]),
    onSuccess: refreshSetmeals,
  });

  const availableDishes = useMemo(() => dishesQuery.data?.records ?? [], [dishesQuery.data?.records]);
  const metrics = useMemo(() => {
    const records = setmealsQuery.data?.records ?? [];
    return {
      total: records.length,
      enabled: records.filter((item) => item.status === 1).length,
      withImage: records.filter((item) => item.image).length,
    };
  }, [setmealsQuery.data?.records]);

  const hasError = categoriesQuery.isError || setmealsQuery.isError || dishesQuery.isError;

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Console / Setmeals"
        title="套餐页聚焦组合关系、图片上传和上架节奏。"
        description="套餐不是另一份菜品表单，它更像组合商品。这里把套餐菜品、份数、图片和状态单独整理出来，方便商家快速调套餐。"
        aside={
          <div className="metrics-grid">
            <MetricCard label="套餐总数" value={metrics.total} />
            <MetricCard label="上架中" tone="support" value={metrics.enabled} />
            <MetricCard label="已配图片" value={metrics.withImage} />
            <MetricCard label="可选菜品" tone="dark" value={availableDishes.length} />
          </div>
        }
      />

      {uploadMutation.isError ? (
        <InlineNotice
          body="图片上传没成功，你可以先手动填图片地址，不会阻塞套餐保存。"
          title="上传失败，已回退到手填 URL"
          tone="warning"
        />
      ) : null}

      <div className="grid-2">
        <section className="panel section-card">
          <SectionTitle
            eyebrow="Setmeal Editor"
            title={form.id ? '编辑套餐' : '新增套餐'}
            description="先确定套餐分类，再维护套餐菜品和份数。保存后顾客端套餐区会直接联动。"
          />

          <div className="stack">
            <div className="image-preview-card">
              <img alt={form.name || '套餐预览'} className="image-preview" src={normalizeImage(form.image, form.name || '套餐预览')} />
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

                  // 套餐仍优先走真实上传接口，手填 URL 只是生产前的兜底方案。
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
                <label htmlFor="setmealCategory">所属分类</label>
                <select
                  id="setmealCategory"
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
                <label htmlFor="setmealStatus">状态</label>
                <select
                  id="setmealStatus"
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  value={form.status}
                >
                  <option value="1">上架</option>
                  <option value="0">下架</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="setmealName">套餐名称</label>
                <input id="setmealName" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name} />
              </div>
              <div className="field">
                <label htmlFor="setmealPrice">价格</label>
                <input id="setmealPrice" onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} value={form.price} />
              </div>
              <div className="field full">
                <label htmlFor="setmealImageUrl">图片地址</label>
                <input
                  id="setmealImageUrl"
                  onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
                  placeholder="如果上传不可用，可以直接粘贴图片 URL"
                  value={form.image}
                />
              </div>
              <div className="field full">
                <label htmlFor="setmealDescription">描述</label>
                <textarea id="setmealDescription" onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} value={form.description} />
              </div>
            </div>

            <div className="stack">
              {form.dishRows.map((row, index) => (
                <div className="field-grid" key={`${row.dishId}-${index}`}>
                  <div className="field">
                    <label htmlFor={`setmealDish-${index}`}>套餐菜品</label>
                    <select
                      id={`setmealDish-${index}`}
                      onChange={(event) => {
                        const nextRows = [...form.dishRows];
                        nextRows[index] = { ...nextRows[index], dishId: event.target.value };
                        setForm((current) => ({ ...current, dishRows: nextRows }));
                      }}
                      value={row.dishId}
                    >
                      <option value="">请选择菜品</option>
                      {availableDishes.map((dish) => (
                        <option key={dish.id} value={dish.id}>
                          {dish.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`setmealCopies-${index}`}>份数</label>
                    <input
                      id={`setmealCopies-${index}`}
                      onChange={(event) => {
                        const nextRows = [...form.dishRows];
                        nextRows[index] = { ...nextRows[index], copies: event.target.value };
                        setForm((current) => ({ ...current, dishRows: nextRows }));
                      }}
                      value={row.copies}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="button-row">
              <button
                className="button secondary"
                onClick={() => setForm((current) => ({ ...current, dishRows: [...current.dishRows, { dishId: '', copies: '1' }] }))}
                type="button"
              >
                追加套餐菜品
              </button>
              <button className="button primary" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} type="button">
                {saveMutation.isPending ? '保存中…' : form.id ? '更新套餐' : '新增套餐'}
              </button>
              <button className="button ghost" onClick={() => setForm(createSetmealForm())} type="button">
                清空表单
              </button>
            </div>
          </div>
        </section>

        <section className="panel section-card">
          <SectionTitle eyebrow="Setmeal List" title="当前套餐" />
          {hasError ? (
            <ErrorState body="套餐、分类或菜品接口暂时不可用，请确认后端已启动。" title="套餐数据加载失败" />
          ) : setmealsQuery.isLoading ? (
            <LoadingState body="正在读取套餐列表。" />
          ) : setmealsQuery.data?.records.length ? (
            <div className="stack">
              {setmealsQuery.data.records.map((setmeal) => (
                <article className="order-card" key={setmeal.id}>
                  <div className="row-between">
                    <div className="stack" style={{ gap: 4 }}>
                      <strong>{setmeal.name}</strong>
                      <span className="soft-copy">{setmeal.categoryName} · {formatCurrency(setmeal.price)}</span>
                    </div>
                    <StatusPill tone={setmeal.status === 1 ? 'live' : 'warning'}>
                      {setmeal.status === 1 ? '上架中' : '已下架'}
                    </StatusPill>
                  </div>
                  <span className="soft-copy">{setmeal.description || '这套套餐还没有补充描述。'}</span>
                  <div className="button-row">
                    <button
                      className="button secondary small"
                      onClick={() =>
                        adminApi.setmealById(setmeal.id).then((detail) =>
                          setForm({
                            id: detail.id,
                            categoryId: String(detail.categoryId),
                            name: detail.name,
                            price: String(detail.price),
                            image: detail.image,
                            description: detail.description,
                            status: String(detail.status),
                            dishRows: detail.setmealDishes.length
                              ? detail.setmealDishes.map((dish) => ({
                                  dishId: String(dish.dishId),
                                  copies: String(dish.copies),
                                }))
                              : [{ dishId: '', copies: '1' }],
                          }))}
                      type="button"
                    >
                      编辑
                    </button>
                    <button
                      className="button ghost small"
                      onClick={() => toggleMutation.mutate({ id: setmeal.id, status: setmeal.status === 1 ? 0 : 1 })}
                      type="button"
                    >
                      {setmeal.status === 1 ? '下架' : '上架'}
                    </button>
                    <button className="button danger small" onClick={() => deleteMutation.mutate(setmeal.id)} type="button">
                      删除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState body="当前还没有套餐，先在左侧组合第一份套餐。" title="套餐列表为空" />
          )}
        </section>
      </div>
    </div>
  );
}
