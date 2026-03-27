import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { userApi, type AddressBook } from '../../shared/api';
import {
  EmptyState,
  ErrorState,
  InlineNotice,
  LoadingState,
  type NoticeTone,
  PageHero,
  StatusPill,
} from '../../shared/components';
import { appCopy } from '../../shared/copy';
import { getErrorMessage } from '../../shared/utils';

interface AddressFormState {
  id?: number;
  consignee: string;
  sex: string;
  phone: string;
  provinceName: string;
  cityName: string;
  districtName: string;
  detail: string;
  label: string;
  isDefault: boolean;
}

interface FeedbackState {
  title: string;
  body: string;
  tone: NoticeTone;
  action?: {
    label: string;
    to: string;
  };
}

function createAddressFormState(address?: AddressBook | null): AddressFormState {
  return {
    id: address?.id,
    consignee: address?.consignee ?? '',
    sex: address?.sex ?? '1',
    phone: address?.phone ?? '',
    provinceName: address?.provinceName ?? '',
    cityName: address?.cityName ?? '',
    districtName: address?.districtName ?? '',
    detail: address?.detail ?? '',
    label: address?.label ?? '家',
    isDefault: address?.isDefault === 1,
  };
}

function FeedbackNotice({ feedback }: { feedback: FeedbackState | null }) {
  if (!feedback) {
    return null;
  }

  return (
    <InlineNotice
      actions={
        feedback.action ? (
          <Link className="button secondary small" to={feedback.action.to}>
            {feedback.action.label}
          </Link>
        ) : undefined
      }
      body={feedback.body}
      title={feedback.title}
      tone={feedback.tone}
    />
  );
}

function AddressFormModal({
  initialValue,
  onClose,
  onSubmit,
  pending,
}: {
  initialValue?: AddressBook | null;
  onClose: () => void;
  onSubmit: (value: AddressFormState) => void;
  pending: boolean;
}) {
  const [form, setForm] = useState<AddressFormState>(() => createAddressFormState(initialValue));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-header">
          <span className="eyebrow support">{form.id ? 'Edit Address' : 'New Address'}</span>
          <h3>{form.id ? appCopy.customerAddresses.modalEditTitle : appCopy.customerAddresses.modalCreateTitle}</h3>
          <p className="soft-copy">{appCopy.customerAddresses.modalDescription}</p>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="consignee">收货人</label>
            <input
              autoComplete="name"
              id="consignee"
              onChange={(event) => setForm((current) => ({ ...current, consignee: event.target.value }))}
              value={form.consignee}
            />
          </div>
          <div className="field">
            <label htmlFor="phone">手机号</label>
            <input
              autoComplete="tel"
              id="phone"
              inputMode="tel"
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              value={form.phone}
            />
          </div>
          <div className="field">
            <label htmlFor="sex">性别</label>
            <select id="sex" onChange={(event) => setForm((current) => ({ ...current, sex: event.target.value }))} value={form.sex}>
              <option value="1">先生</option>
              <option value="2">女士</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="label">标签</label>
            <select id="label" onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} value={form.label}>
              <option value="家">家</option>
              <option value="公司">公司</option>
              <option value="学校">学校</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="province">省份</label>
            <input
              autoComplete="address-level1"
              id="province"
              onChange={(event) => setForm((current) => ({ ...current, provinceName: event.target.value }))}
              value={form.provinceName}
            />
          </div>
          <div className="field">
            <label htmlFor="city">城市</label>
            <input
              autoComplete="address-level2"
              id="city"
              onChange={(event) => setForm((current) => ({ ...current, cityName: event.target.value }))}
              value={form.cityName}
            />
          </div>
          <div className="field">
            <label htmlFor="district">区县</label>
            <input
              autoComplete="address-level3"
              id="district"
              onChange={(event) => setForm((current) => ({ ...current, districtName: event.target.value }))}
              value={form.districtName}
            />
          </div>
          <div className="field">
            <label htmlFor="default">默认地址</label>
            <select id="default" onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.value === '1' }))} value={form.isDefault ? '1' : '0'}>
              <option value="1">设为默认</option>
              <option value="0">仅保存</option>
            </select>
          </div>
          <div className="field full">
            <label htmlFor="detail">详细地址</label>
            <textarea
              autoComplete="street-address"
              id="detail"
              onChange={(event) => setForm((current) => ({ ...current, detail: event.target.value }))}
              value={form.detail}
            />
          </div>
        </div>

        <div className="button-row" style={{ marginTop: 18 }}>
          <button className="button primary" disabled={pending} onClick={() => onSubmit(form)} type="button">
            {pending ? '保存中…' : '保存地址'}
          </button>
          <button className="button secondary" disabled={pending} onClick={onClose} type="button">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

export function CustomerAddressBookPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [editingAddress, setEditingAddress] = useState<AddressBook | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const fromCheckout = Boolean((location.state as { fromCheckout?: boolean } | null)?.fromCheckout);

  const addressListQuery = useQuery({
    queryKey: ['customer', 'address', 'list'],
    queryFn: () => userApi.addressList(),
  });

  const saveMutation = useMutation({
    mutationFn: async (form: AddressFormState) => {
      const payload = {
        consignee: form.consignee,
        sex: form.sex,
        phone: form.phone,
        provinceName: form.provinceName,
        cityName: form.cityName,
        districtName: form.districtName,
        detail: form.detail,
        label: form.label,
        isDefault: form.isDefault ? 1 : 0,
      };

      const result = form.id
        ? await userApi.updateAddress({ ...payload, id: form.id })
        : await userApi.saveAddress(payload);

      if (form.isDefault) {
        const targetId = form.id ?? (result as AddressBook).id;
        await userApi.setDefaultAddress(targetId);
      }

      return form;
    },
    onError: (error) => {
      setFeedback({
        title: '地址保存失败',
        body: getErrorMessage(error),
        tone: 'fallback',
      });
    },
    onSuccess: async (form) => {
      setEditingAddress(null);
      setIsCreating(false);
      await queryClient.invalidateQueries({ queryKey: ['customer', 'address'] });
      setFeedback({
        title: form.isDefault
          ? appCopy.customerAddresses.saveDefaultSuccessTitle
          : appCopy.customerAddresses.saveSuccessTitle,
        body: form.isDefault
          ? appCopy.customerAddresses.saveDefaultSuccessBody
          : appCopy.customerAddresses.saveSuccessBody,
        tone: 'live',
        action: fromCheckout && form.isDefault
          ? { label: appCopy.customerAddresses.checkoutHintAction, to: '/customer' }
          : undefined,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userApi.deleteAddress(id),
    onError: (error) => {
      setFeedback({
        title: '删除失败',
        body: getErrorMessage(error),
        tone: 'fallback',
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer', 'address'] });
      setFeedback({
        title: appCopy.customerAddresses.deleteSuccessTitle,
        body: appCopy.customerAddresses.deleteSuccessBody,
        tone: 'live',
      });
    },
  });

  const defaultMutation = useMutation({
    mutationFn: (id: number) => userApi.setDefaultAddress(id),
    onError: (error) => {
      setFeedback({
        title: '默认地址切换失败',
        body: getErrorMessage(error),
        tone: 'fallback',
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['customer', 'address'] });
      setFeedback({
        title: appCopy.customerAddresses.defaultSuccessTitle,
        body: appCopy.customerAddresses.defaultSuccessBody,
        tone: 'live',
        action: fromCheckout ? { label: appCopy.customerAddresses.checkoutHintAction, to: '/customer' } : undefined,
      });
    },
  });

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Customer / Address Book"
        title={appCopy.customerAddresses.heroTitle}
        description={appCopy.customerAddresses.heroDescription}
        actions={
          <button className="button primary" onClick={() => setIsCreating(true)} type="button">
            {appCopy.customerAddresses.createAction}
          </button>
        }
      />

      {fromCheckout ? (
        <InlineNotice
          actions={
            <Link className="button secondary small" to="/customer">
              {appCopy.customerAddresses.checkoutHintAction}
            </Link>
          }
          body={appCopy.customerAddresses.checkoutHintBody}
          title={appCopy.customerAddresses.checkoutHintTitle}
          tone="warning"
        />
      ) : null}

      <FeedbackNotice feedback={feedback} />

      {addressListQuery.isLoading ? (
        <LoadingState body="正在读取当前用户的地址列表。" />
      ) : addressListQuery.isError ? (
        <ErrorState body="地址簿接口暂时不可用，请先确认后端 8080 已启动。" title="地址簿加载失败" />
      ) : addressListQuery.data?.length ? (
        <div className="cards-grid">
          {addressListQuery.data.map((address) => (
            <article className="address-card section-card" key={address.id}>
              <div className="row-between">
                <div className="stack" style={{ gap: 4 }}>
                  <strong>{address.consignee}</strong>
                  <span className="soft-copy">{address.phone}</span>
                </div>
                {address.isDefault === 1 ? <StatusPill tone="live">默认</StatusPill> : null}
              </div>
              <p className="soft-copy">
                {address.provinceName}
                {address.cityName}
                {address.districtName}
                {address.detail}
              </p>
              <div className="button-row">
                <button className="button secondary small" onClick={() => setEditingAddress(address)} type="button">
                  编辑
                </button>
                {address.isDefault !== 1 ? (
                  <button className="button ghost small" disabled={defaultMutation.isPending} onClick={() => defaultMutation.mutate(address.id)} type="button">
                    设为默认
                  </button>
                ) : null}
                <button className="button danger small" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(address.id)} type="button">
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          action={
            <button className="button secondary" onClick={() => setIsCreating(true)} type="button">
              {appCopy.customerAddresses.createAction}
            </button>
          }
          body={appCopy.customerAddresses.emptyBody}
          title={appCopy.customerAddresses.emptyTitle}
        />
      )}

      {(isCreating || editingAddress) ? (
        <AddressFormModal
          initialValue={editingAddress}
          onClose={() => {
            setEditingAddress(null);
            setIsCreating(false);
          }}
          onSubmit={(value) => saveMutation.mutate(value)}
          pending={saveMutation.isPending}
        />
      ) : null}
    </div>
  );
}
