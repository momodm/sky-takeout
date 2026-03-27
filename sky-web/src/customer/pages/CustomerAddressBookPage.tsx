import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi, type AddressBook } from '../../shared/api';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHero,
  StatusPill,
} from '../../shared/components';

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

function AddressFormModal({
  initialValue,
  onClose,
  onSubmit,
}: {
  initialValue?: AddressBook | null;
  onClose: () => void;
  onSubmit: (value: AddressFormState) => void;
}) {
  const [form, setForm] = useState<AddressFormState>(() => createAddressFormState(initialValue));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-header">
          <span className="eyebrow support">{form.id ? 'Edit Address' : 'New Address'}</span>
          <h3>{form.id ? '更新送达地址' : '新增收货地址'}</h3>
          <p className="soft-copy">前端会先保存地址，再按你的选择切换默认地址。</p>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="consignee">收货人</label>
            <input id="consignee" onChange={(event) => setForm((current) => ({ ...current, consignee: event.target.value }))} value={form.consignee} />
          </div>
          <div className="field">
            <label htmlFor="phone">手机号</label>
            <input id="phone" onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} value={form.phone} />
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
            <input id="province" onChange={(event) => setForm((current) => ({ ...current, provinceName: event.target.value }))} value={form.provinceName} />
          </div>
          <div className="field">
            <label htmlFor="city">城市</label>
            <input id="city" onChange={(event) => setForm((current) => ({ ...current, cityName: event.target.value }))} value={form.cityName} />
          </div>
          <div className="field">
            <label htmlFor="district">区县</label>
            <input id="district" onChange={(event) => setForm((current) => ({ ...current, districtName: event.target.value }))} value={form.districtName} />
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
            <textarea id="detail" onChange={(event) => setForm((current) => ({ ...current, detail: event.target.value }))} value={form.detail} />
          </div>
        </div>

        <div className="button-row" style={{ marginTop: 18 }}>
          <button className="button primary" onClick={() => onSubmit(form)} type="button">
            保存地址
          </button>
          <button className="button secondary" onClick={onClose} type="button">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

export function CustomerAddressBookPage() {
  const queryClient = useQueryClient();
  const [editingAddress, setEditingAddress] = useState<AddressBook | null>(null);
  const [isCreating, setIsCreating] = useState(false);
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
    },
    onSuccess: async () => {
      setEditingAddress(null);
      setIsCreating(false);
      await queryClient.invalidateQueries({ queryKey: ['customer', 'address'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userApi.deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer', 'address'] }),
  });
  const defaultMutation = useMutation({
    mutationFn: (id: number) => userApi.setDefaultAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer', 'address'] }),
  });

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Customer / Address Book"
        title="地址簿要尽量轻，动作却要完整"
        description="地址簿页把新增、修改、删除、设默认这几条接口合到一页，顾客可以直接把默认地址准备好再去下单。"
        actions={
          <button className="button primary" onClick={() => setIsCreating(true)} type="button">
            新增地址
          </button>
        }
      />

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
                  <button className="button ghost small" onClick={() => defaultMutation.mutate(address.id)} type="button">
                    设为默认
                  </button>
                ) : null}
                <button className="button danger small" onClick={() => deleteMutation.mutate(address.id)} type="button">
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState body="目前还没有地址，先新增一个默认地址，点餐和下单就会顺很多。" title="地址簿还没有内容" />
      )}

      {(isCreating || editingAddress) ? (
        <AddressFormModal
          initialValue={editingAddress}
          onClose={() => {
            setEditingAddress(null);
            setIsCreating(false);
          }}
          onSubmit={(value) => saveMutation.mutate(value)}
        />
      ) : null}
    </div>
  );
}
