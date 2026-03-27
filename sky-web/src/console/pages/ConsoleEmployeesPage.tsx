import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../shared/api';
import {
  EmptyState,
  ErrorState,
  InlineNotice,
  LoadingState,
  PageHero,
  SectionTitle,
  StatusPill,
  type NoticeTone,
} from '../../shared/components';
import { appCopy } from '../../shared/copy';
import { getErrorMessage } from '../../shared/utils';

interface FeedbackState {
  title: string;
  body: string;
  tone: NoticeTone;
}

function createEmployeeForm() {
  return {
    id: undefined as number | undefined,
    username: '',
    name: '',
    phone: '',
    sex: '1',
    idNumber: '',
  };
}

export function ConsoleEmployeesPage() {
  const queryClient = useQueryClient();
  const [employeeForm, setEmployeeForm] = useState(createEmployeeForm());
  const [keyword, setKeyword] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const deferredKeyword = useDeferredValue(keyword);

  const employeesQuery = useQuery({
    queryKey: ['console', 'employees', deferredKeyword],
    queryFn: () => adminApi.employeePage(1, 20, deferredKeyword),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        id: employeeForm.id,
        username: employeeForm.username,
        name: employeeForm.name,
        phone: employeeForm.phone,
        sex: employeeForm.sex,
        idNumber: employeeForm.idNumber,
      };
      return employeeForm.id ? adminApi.updateEmployee(payload) : adminApi.saveEmployee(payload);
    },
    onSuccess: async () => {
      setEmployeeForm(createEmployeeForm());
      await queryClient.invalidateQueries({ queryKey: ['console', 'employees'] });
      setFeedback({
        title: employeeForm.id ? '员工已更新' : '员工已新增',
        body: appCopy.consoleFeedback.saveSuccess('员工'),
        tone: 'live',
      });
    },
    onError: (error) => {
      setFeedback({
        title: appCopy.consoleFeedback.saveErrorTitle('员工'),
        body: getErrorMessage(error),
        tone: 'fallback',
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => adminApi.employeeStatus(status, id),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['console', 'employees'] });
      setFeedback({
        title: variables.status === 1 ? '员工已启用' : '员工已停用',
        body: appCopy.consoleFeedback.statusSuccess('员工', variables.status === 1 ? '启用' : '停用'),
        tone: 'live',
      });
    },
    onError: (error, variables) => {
      setFeedback({
        title: appCopy.consoleFeedback.statusErrorTitle('员工', variables.status === 1 ? '启用' : '停用'),
        body: getErrorMessage(error),
        tone: 'fallback',
      });
    },
  });

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Console / Employees"
        title="员工页保持轻量，但要把新增、编辑和启停做完整"
        description="当前后端没有单独的角色体系，这一页优先聚焦已有员工接口，把最常用的新增、编辑和账号启停串起来。"
        actions={
          <div className="field">
            <label htmlFor="employeeSearch">按姓名筛选</label>
            <input id="employeeSearch" onChange={(event) => setKeyword(event.target.value)} value={keyword} />
          </div>
        }
      />

      {feedback ? <InlineNotice body={feedback.body} title={feedback.title} tone={feedback.tone} /> : null}

      <div className="grid-2">
        <section className="panel section-card">
          <SectionTitle
            eyebrow="Employee Editor"
            title={employeeForm.id ? '编辑员工' : '新增员工'}
            description="员工页保持轻量，先把最常用的录入、修改和启停串起来。"
          />
          <div className="field-grid">
            <div className="field">
              <label htmlFor="employeeUsername">账号</label>
              <input id="employeeUsername" onChange={(event) => setEmployeeForm((current) => ({ ...current, username: event.target.value }))} value={employeeForm.username} />
            </div>
            <div className="field">
              <label htmlFor="employeeName">姓名</label>
              <input id="employeeName" onChange={(event) => setEmployeeForm((current) => ({ ...current, name: event.target.value }))} value={employeeForm.name} />
            </div>
            <div className="field">
              <label htmlFor="employeePhone">手机号</label>
              <input id="employeePhone" onChange={(event) => setEmployeeForm((current) => ({ ...current, phone: event.target.value }))} value={employeeForm.phone} />
            </div>
            <div className="field">
              <label htmlFor="employeeSex">性别</label>
              <select id="employeeSex" onChange={(event) => setEmployeeForm((current) => ({ ...current, sex: event.target.value }))} value={employeeForm.sex}>
                <option value="1">男</option>
                <option value="2">女</option>
              </select>
            </div>
            <div className="field full">
              <label htmlFor="employeeIdNumber">身份证号</label>
              <input id="employeeIdNumber" onChange={(event) => setEmployeeForm((current) => ({ ...current, idNumber: event.target.value }))} value={employeeForm.idNumber} />
            </div>
          </div>
          <div className="button-row">
            <button className="button primary" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} type="button">
              {saveMutation.isPending ? '保存中…' : employeeForm.id ? '更新员工' : '新增员工'}
            </button>
            <button className="button ghost" onClick={() => setEmployeeForm(createEmployeeForm())} type="button">
              重置
            </button>
          </div>
        </section>

        <section className="panel section-card">
          <SectionTitle eyebrow="Employee List" title="员工列表" />
          {employeesQuery.isError ? (
            <ErrorState body="员工分页接口暂时不可用，请确认后端 8080 已启动。" title="员工列表加载失败" />
          ) : employeesQuery.isLoading ? (
            <LoadingState body="正在读取员工分页结果。" />
          ) : employeesQuery.data?.records.length ? (
            <div className="stack">
              {employeesQuery.data.records.map((employee) => (
                <article className="order-card" key={employee.id}>
                  <div className="row-between">
                    <div className="stack" style={{ gap: 4 }}>
                      <strong>{employee.name}</strong>
                      <span className="soft-copy">{employee.username} · {employee.phone}</span>
                    </div>
                    <StatusPill tone={employee.status === 1 ? 'live' : 'warning'}>
                      {employee.status === 1 ? '启用中' : '已停用'}
                    </StatusPill>
                  </div>
                  <div className="button-row">
                    <button
                      className="button secondary small"
                      onClick={() => setEmployeeForm({
                        id: employee.id,
                        username: employee.username,
                        name: employee.name,
                        phone: employee.phone,
                        sex: employee.sex,
                        idNumber: employee.idNumber,
                      })}
                      type="button"
                    >
                      编辑
                    </button>
                    <button
                      className="button ghost small"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: employee.id, status: employee.status === 1 ? 0 : 1 })}
                      type="button"
                    >
                      {employee.status === 1 ? '停用' : '启用'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState body="当前还没有匹配员工。" title="没有员工结果" />
          )}
        </section>
      </div>
    </div>
  );
}
