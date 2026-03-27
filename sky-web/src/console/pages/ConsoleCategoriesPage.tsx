import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../shared/api';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  PageHero,
  SectionTitle,
  StatusPill,
} from '../../shared/components';

function createCategoryForm() {
  return {
    id: undefined as number | undefined,
    type: '1',
    name: '',
    sort: '1',
  };
}

export function ConsoleCategoriesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(createCategoryForm());

  const dishCategoriesQuery = useQuery({
    queryKey: ['console', 'categories', 'dish-page'],
    queryFn: () => adminApi.categoryPage(1, 50, 1),
  });
  const setmealCategoriesQuery = useQuery({
    queryKey: ['console', 'categories', 'setmeal-page'],
    queryFn: () => adminApi.categoryPage(1, 50, 2),
  });

  const refreshCategories = async () => {
    await queryClient.invalidateQueries({ queryKey: ['console', 'categories'] });
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        id: form.id,
        type: Number(form.type),
        name: form.name,
        sort: Number(form.sort || 0),
      };

      return form.id ? adminApi.updateCategory(payload) : adminApi.saveCategory(payload);
    },
    onSuccess: async () => {
      setForm(createCategoryForm());
      await refreshCategories();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) =>
      adminApi.categoryStatus(status, id),
    onSuccess: refreshCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteCategory(id),
    onSuccess: refreshCategories,
  });

  const hasError = dishCategoriesQuery.isError || setmealCategoriesQuery.isError;

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Console / Categories"
        title="先把分类体系理顺，顾客端和后台的结构才会稳定。"
        description="分类页只处理一件事：把菜品分类和套餐分类维护清楚。这里保留新增、编辑、启停和删除，避免再和菜品、套餐表单混在一起。"
        aside={
          <div className="metrics-grid">
            <MetricCard label="菜品分类" value={dishCategoriesQuery.data?.total ?? 0} />
            <MetricCard label="套餐分类" tone="support" value={setmealCategoriesQuery.data?.total ?? 0} />
            <MetricCard
              label="启用中的分类"
              value={
                (dishCategoriesQuery.data?.records.filter((item) => item.status === 1).length ?? 0) +
                (setmealCategoriesQuery.data?.records.filter((item) => item.status === 1).length ?? 0)
              }
            />
            <MetricCard label="当前编辑类型" tone="dark" value={form.type === '1' ? '菜品分类' : '套餐分类'} />
          </div>
        }
      />

      <div className="grid-2">
        <section className="panel section-card">
          <SectionTitle
            eyebrow="Editor"
            title={form.id ? '编辑分类' : '新增分类'}
            description="优先录入分类名和排序，保存后顾客端和后台筛选会立即联动。"
          />
          <div className="field-grid">
            <div className="field">
              <label htmlFor="categoryType">分类类型</label>
              <select
                id="categoryType"
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                value={form.type}
              >
                <option value="1">菜品分类</option>
                <option value="2">套餐分类</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="categorySort">排序值</label>
              <input
                id="categorySort"
                onChange={(event) => setForm((current) => ({ ...current, sort: event.target.value }))}
                value={form.sort}
              />
            </div>
            <div className="field full">
              <label htmlFor="categoryName">分类名称</label>
              <input
                id="categoryName"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                value={form.name}
              />
            </div>
          </div>
          <div className="button-row">
            <button className="button primary" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} type="button">
              {saveMutation.isPending ? '保存中…' : form.id ? '更新分类' : '新增分类'}
            </button>
            <button className="button ghost" onClick={() => setForm(createCategoryForm())} type="button">
              清空表单
            </button>
          </div>
        </section>

        {hasError ? (
          <ErrorState
            body="分类接口暂时不可用，请先确认后端服务已启动。"
            title="分类数据加载失败"
          />
        ) : (
          <div className="stack">
            {[{
              title: '菜品分类',
              eyebrow: 'Dish Categories',
              records: dishCategoriesQuery.data?.records ?? [],
            }, {
              title: '套餐分类',
              eyebrow: 'Setmeal Categories',
              records: setmealCategoriesQuery.data?.records ?? [],
            }].map((group) => (
              <section className="panel section-card" key={group.title}>
                <SectionTitle eyebrow={group.eyebrow} title={group.title} />
                {dishCategoriesQuery.isLoading || setmealCategoriesQuery.isLoading ? (
                  <LoadingState body="正在读取分类列表。" />
                ) : group.records.length ? (
                  <div className="stack">
                    {group.records.map((category) => (
                      <article className="order-card" key={category.id}>
                        <div className="row-between">
                          <div className="stack" style={{ gap: 4 }}>
                            <strong>{category.name}</strong>
                            <span className="soft-copy">排序 {category.sort}</span>
                          </div>
                          <StatusPill tone={category.status === 1 ? 'live' : 'warning'}>
                            {category.status === 1 ? '启用中' : '已禁用'}
                          </StatusPill>
                        </div>
                        <div className="button-row">
                          <button
                            className="button secondary small"
                            onClick={() =>
                              setForm({
                                id: category.id,
                                type: String(category.type),
                                name: category.name,
                                sort: String(category.sort),
                              })}
                            type="button"
                          >
                            编辑
                          </button>
                          <button
                            className="button ghost small"
                            onClick={() =>
                              toggleMutation.mutate({
                                id: category.id,
                                status: category.status === 1 ? 0 : 1,
                              })}
                            type="button"
                          >
                            {category.status === 1 ? '禁用' : '启用'}
                          </button>
                          <button
                            className="button danger small"
                            onClick={() => deleteMutation.mutate(category.id)}
                            type="button"
                          >
                            删除
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState body="当前还没有分类记录，先在左侧录入第一条。" title={`${group.title}为空`} />
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
