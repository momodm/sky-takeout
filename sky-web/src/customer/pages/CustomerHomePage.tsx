import { startTransition, useMemo, useState, useTransition } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { userApi, type AddressBook, type DishVO, type ShoppingCart } from '../../shared/api';
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
import { useCustomerShell } from '../CustomerShell';
import {
  buildFlavorSelection,
  formatCurrency,
  formatNumber,
  normalizeImage,
  parseFlavorValues,
  summarizeCart,
} from '../../shared/utils';

interface DishSelectionState {
  dish: DishVO;
  values: Record<string, string>;
}

function DishFlavorModal({
  selection,
  onClose,
  onConfirm,
}: {
  selection: DishSelectionState;
  onClose: () => void;
  onConfirm: (value: Record<string, string>) => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-header">
          <span className="eyebrow warning">Flavor Builder</span>
          <h3>{selection.dish.name}</h3>
          <p className="soft-copy">带口味的菜品会把你当前选中的规格拼成 dishFlavor，保证购物车和订单明细都能完整回显。</p>
        </div>

        <div className="stack">
          {selection.dish.flavors.map((flavor) => {
            const options = parseFlavorValues(flavor);
            return (
              <div className="field full" key={flavor.name}>
                <label htmlFor={flavor.name}>{flavor.name}</label>
                <select
                  id={flavor.name}
                  onChange={(event) => {
                    selection.values[flavor.name] = event.target.value;
                  }}
                  value={selection.values[flavor.name] ?? options[0]}
                >
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="button-row" style={{ marginTop: 18 }}>
          <button className="button primary" onClick={() => onConfirm({ ...selection.values })} type="button">
            加入购物车
          </button>
          <button className="button secondary" onClick={onClose} type="button">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  address,
  canCheckout,
  cartItems,
  onAdd,
  onClose,
  onClean,
  onRemarkChange,
  onSubmit,
  onSub,
  packAmount,
  remark,
  setPackAmount,
  setTablewareNumber,
  tablewareNumber,
}: {
  address: AddressBook | undefined;
  canCheckout: boolean;
  cartItems: ShoppingCart[];
  onAdd: (item: ShoppingCart) => void;
  onClose: () => void;
  onClean: () => void;
  onRemarkChange: (value: string) => void;
  onSubmit: () => void;
  onSub: (item: ShoppingCart) => void;
  packAmount: string;
  remark: string;
  setPackAmount: (value: string) => void;
  setTablewareNumber: (value: string) => void;
  tablewareNumber: string;
}) {
  const cartSummary = summarizeCart(cartItems);

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-card" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-header">
          <span className="eyebrow warning">Cart & Checkout</span>
          <h3>购物车与提交订单</h3>
          <p className="soft-copy">这里直接串上购物车、默认地址、备注和提交订单接口，方便你马上从顾客视角走闭环。</p>
        </div>

        {!cartItems.length ? (
          <EmptyState body="先选几道菜，购物车才会在这里出现真实明细。" title="购物车还空着" />
        ) : (
          <div className="stack">
            {cartItems.map((item) => (
              <article className="order-card" key={item.id}>
                <div className="row-between">
                  <div className="stack" style={{ gap: 4 }}>
                    <strong>{item.name}</strong>
                    <span className="soft-copy">{item.dishFlavor || '标准规格'}</span>
                  </div>
                  <strong>{formatCurrency(item.amount)}</strong>
                </div>
                <div className="row-between">
                  <div className="button-row">
                    <button className="button secondary small" onClick={() => onSub(item)} type="button">
                      -1
                    </button>
                    <button className="button secondary small" onClick={() => onAdd(item)} type="button">
                      +1
                    </button>
                  </div>
                  <StatusPill tone="demo">共 {item.number} 份</StatusPill>
                </div>
              </article>
            ))}

            <div className="field-grid">
              <div className="field full">
                <label htmlFor="remark">备注</label>
                <textarea id="remark" onChange={(event) => onRemarkChange(event.target.value)} value={remark} />
              </div>
              <div className="field">
                <label htmlFor="tableware">餐具份数</label>
                <select id="tableware" onChange={(event) => setTablewareNumber(event.target.value)} value={tablewareNumber}>
                  <option value="1">1 份</option>
                  <option value="2">2 份</option>
                  <option value="3">3 份</option>
                  <option value="4">4 份</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="pack">打包费</label>
                <input id="pack" onChange={(event) => setPackAmount(event.target.value)} value={packAmount} />
              </div>
            </div>

            <InlineNotice
              body={address
                ? `${address.provinceName}${address.cityName}${address.districtName}${address.detail}`
                : '还没有默认地址，点右下角去地址簿补一个。'}
              title={address ? `默认地址 · ${address.consignee}` : '默认地址未设置'}
              tone={address ? 'live' : 'warning'}
            />

            <div className="row-between">
              <div className="stack" style={{ gap: 4 }}>
                <strong>应付总额 {formatCurrency(cartSummary.amount + Number(packAmount || 0))}</strong>
                <span className="soft-copy">提交后不会自动支付，你可以去订单中心触发 mock 支付。</span>
              </div>
              <div className="button-row">
                <button className="button ghost" onClick={onClean} type="button">
                  清空购物车
                </button>
                <button className="button primary" disabled={!canCheckout || !address} onClick={onSubmit} type="button">
                  提交订单
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CustomerHomePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, shopStatus } = useCustomerShell();
  const [activeDishCategoryId, setActiveDishCategoryId] = useState<number | null>(null);
  const [activeSetmealCategoryId, setActiveSetmealCategoryId] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [remark, setRemark] = useState('');
  const [tablewareNumber, setTablewareNumber] = useState('2');
  const [packAmount, setPackAmount] = useState('2');
  const [pendingDish, setPendingDish] = useState<DishSelectionState | null>(null);
  const [, startTabTransition] = useTransition();

  const dishCategoriesQuery = useQuery({
    queryKey: ['customer', 'categories', 'dish'],
    queryFn: () => userApi.categories(1),
  });
  const setmealCategoriesQuery = useQuery({
    queryKey: ['customer', 'categories', 'setmeal'],
    queryFn: () => userApi.categories(2),
  });
  const cartQuery = useQuery({
    queryKey: ['customer', 'cart'],
    queryFn: () => userApi.cartList(),
  });
  const defaultAddressQuery = useQuery({
    queryKey: ['customer', 'address', 'default'],
    queryFn: () => userApi.addressDefault(),
    retry: false,
  });
  const resolvedDishCategoryId = activeDishCategoryId ?? dishCategoriesQuery.data?.[0]?.id ?? null;
  const resolvedSetmealCategoryId = activeSetmealCategoryId ?? setmealCategoriesQuery.data?.[0]?.id ?? null;
  const dishesQuery = useQuery({
    queryKey: ['customer', 'dishes', resolvedDishCategoryId],
    queryFn: () => userApi.dishes(resolvedDishCategoryId as number),
    enabled: Boolean(resolvedDishCategoryId),
  });
  const setmealsQuery = useQuery({
    queryKey: ['customer', 'setmeals', resolvedSetmealCategoryId],
    queryFn: () => userApi.setmeals(resolvedSetmealCategoryId as number),
    enabled: Boolean(resolvedSetmealCategoryId),
  });

  const invalidateCustomerQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] }),
      queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] }),
      queryClient.invalidateQueries({ queryKey: ['customer', 'address'] }),
    ]);
  };

  const addCartMutation = useMutation({
    mutationFn: (payload: { dishId?: number; setmealId?: number; dishFlavor?: string }) => userApi.cartAdd(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
    },
  });

  const subCartMutation = useMutation({
    mutationFn: (payload: { dishId?: number; setmealId?: number; dishFlavor?: string }) => userApi.cartSub(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
    },
  });

  const cleanCartMutation = useMutation({
    mutationFn: () => userApi.cartClean(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
    },
  });

  const submitOrderMutation = useMutation({
    mutationFn: () => {
      const address = defaultAddressQuery.data;
      if (!address) {
        throw new Error('请先准备一个默认地址');
      }

      return userApi.submitOrder({
        addressBookId: address.id,
        remark,
        payMethod: 1,
        estimatedDeliveryTime: undefined,
        packAmount: Number(packAmount || 0),
        tablewareNumber: Number(tablewareNumber || 1),
      });
    },
    onSuccess: async () => {
      setCartOpen(false);
      setRemark('');
      await invalidateCustomerQueries();
      navigate('/customer/orders');
    },
  });

  const cartItems = useMemo(() => cartQuery.data ?? [], [cartQuery.data]);
  const cartSummary = useMemo(() => summarizeCart(cartItems), [cartItems]);
  const canCheckout = cartSummary.count > 0 && shopStatus === 1;
  const hasCatalogError =
    dishCategoriesQuery.isError ||
    setmealCategoriesQuery.isError ||
    cartQuery.isError ||
    dishesQuery.isError ||
    setmealsQuery.isError;

  const onAddDish = (dish: DishVO) => {
    if (dish.flavors.length) {
      const values = dish.flavors.reduce<Record<string, string>>((accumulator, flavor) => {
        accumulator[flavor.name] = parseFlavorValues(flavor)[0] ?? '';
        return accumulator;
      }, {});
      setPendingDish({ dish, values });
      return;
    }

    addCartMutation.mutate({ dishId: dish.id });
  };

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Customer / Order Flow"
        title="把菜品流、套餐区和购物车做成真正能下单的移动端首页"
        description="顾客端这版优先保证真正能点单：营业状态、分类、菜品、套餐、购物车、地址簿和订单动作都直接连现在的 user 接口。"
        actions={
          <>
            <button className="button primary" onClick={() => setCartOpen(true)} type="button">
              打开购物车
            </button>
            <Link className="button secondary" to="/customer/orders">
              查看订单
            </Link>
          </>
        }
        aside={
          <div className="metrics-grid">
            <MetricCard hint="来自购物车实时汇总" label="购物车件数" value={formatNumber(cartSummary.count)} />
            <MetricCard hint="当前结算口径" label="当前合计" tone="support" value={formatCurrency(cartSummary.amount)} />
            <MetricCard hint="当前默认地址" label="收货地址" value={defaultAddressQuery.data ? '已就绪' : '未设置'} />
            <MetricCard hint="mock 登录已接现有 user token" label="当前顾客" value={currentUser ? `#${currentUser.id}` : '待连接'} />
          </div>
        }
      />

      {shopStatus !== 1 ? (
        <InlineNotice body="后端返回店铺当前不营业，所以首页仍可浏览，但会禁用提交订单。" title="店铺当前打烊中" tone="warning" />
      ) : (
        <InlineNotice body="当前门店营业正常，你可以直接把菜品或套餐加入购物车，再提交订单。" title="门店状态正常" tone="live" />
      )}

      {hasCatalogError ? (
        <ErrorState
          body="顾客端分类、菜品、套餐或购物车接口暂时不可用，请先确认后端 8080 与用户端接口已经启动。"
          title="点餐首页加载失败"
        />
      ) : (
        <div className="customer-grid">
          <section className="panel section-card">
            <SectionTitle
              eyebrow="Pick Dishes"
              title="今日点什么"
              description="分类切换会触发对应接口查询；为了让移动端单手操作更顺，分类和菜品都尽量压成卡片流。"
              actions={
                <div className="button-row">
                  <StatusPill tone="live">菜品分类 {dishCategoriesQuery.data?.length ?? 0}</StatusPill>
                  <StatusPill tone="demo">套餐分类 {setmealCategoriesQuery.data?.length ?? 0}</StatusPill>
                </div>
              }
            />

            {dishCategoriesQuery.isLoading ? (
              <LoadingState body="正在拉取用户端可点的菜品分类。" />
            ) : dishCategoriesQuery.data?.length ? (
              <div className="stack">
                <div className="tabs">
                  {dishCategoriesQuery.data.map((category) => (
                    <button
                      className={`tab-button${resolvedDishCategoryId === category.id ? ' active' : ''}`}
                      key={category.id}
                      onClick={() => {
                        startTabTransition(() => {
                          setActiveDishCategoryId(category.id);
                        });
                      }}
                      type="button"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                {dishesQuery.isLoading ? (
                  <LoadingState body="正在读取该分类下的菜品和口味。" title="切换中" />
                ) : dishesQuery.data?.length ? (
                  <div className="cards-grid">
                    {dishesQuery.data.map((dish) => (
                      <article className="food-card" key={dish.id}>
                        <div className="food-card-visual">
                          <img alt={dish.name} src={normalizeImage(dish.image, dish.name)} />
                        </div>
                        <div className="food-card-body">
                          <div className="stack" style={{ gap: 6 }}>
                            <h3>{dish.name}</h3>
                            <p className="soft-copy">{dish.description || '没有额外文案时，就直接强调食材和口味选择。'}</p>
                          </div>
                          <div className="chip-row">
                            {dish.flavors.map((flavor) => (
                              <StatusPill key={flavor.name} tone="demo">
                                {flavor.name}
                              </StatusPill>
                            ))}
                          </div>
                          <div className="price-row">
                            <span className="price-tag">{formatCurrency(dish.price)}</span>
                            <button className="button primary small" onClick={() => onAddDish(dish)} type="button">
                              加入购物车
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState body="后端没有返回该分类下的上架菜品。" title="这个分类还没有上架菜品" />
                )}
              </div>
            ) : (
              <EmptyState body="请先在后台创建可用的菜品分类。" title="顾客端还没有菜品分类" />
            )}
          </section>

          <section className="panel section-card">
          <SectionTitle
            eyebrow="Setmeal"
            title="套餐专区"
            description="套餐专区会继续使用现有 user/setmeal/list。第一版先把列表、加购和价格反馈做顺。"
          />

          {setmealCategoriesQuery.isLoading ? (
            <LoadingState body="正在读取套餐分类。" />
          ) : setmealCategoriesQuery.data?.length ? (
            <div className="stack">
              <div className="tabs">
                {setmealCategoriesQuery.data.map((category) => (
                  <button
                    className={`tab-button${resolvedSetmealCategoryId === category.id ? ' active' : ''}`}
                    key={category.id}
                    onClick={() => {
                      startTransition(() => {
                        setActiveSetmealCategoryId(category.id);
                      });
                    }}
                    type="button"
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {setmealsQuery.isLoading ? (
                <LoadingState body="正在拉取套餐列表。" />
              ) : setmealsQuery.data?.length ? (
                <div className="stack">
                  {setmealsQuery.data.map((setmeal) => (
                    <article className="order-card" key={setmeal.id}>
                      <div className="row-between">
                        <div className="stack" style={{ gap: 4 }}>
                          <strong>{setmeal.name}</strong>
                          <span className="soft-copy">{setmeal.description || '轻量套餐卡会把重点放在价格和下单速度。'}</span>
                        </div>
                        <strong>{formatCurrency(setmeal.price)}</strong>
                      </div>
                      <button
                        className="button secondary"
                        onClick={() => addCartMutation.mutate({ setmealId: setmeal.id })}
                        type="button"
                      >
                        加入套餐
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState body="当前套餐分类下还没有可售套餐。" title="套餐区暂时为空" />
              )}
            </div>
          ) : (
            <EmptyState body="请先在后台创建套餐分类和套餐。" title="顾客端还没有套餐" />
          )}
          </section>
        </div>
      )}

      <div className="sticky-cart-bar panel-subtle">
        <div className="stack" style={{ gap: 4 }}>
          <strong>购物车已选 {formatNumber(cartSummary.count)} 件</strong>
          <span className="soft-copy">当前金额 {formatCurrency(cartSummary.amount)}，默认地址 {defaultAddressQuery.data ? '已准备好' : '还没设置'}。</span>
        </div>
        <div className="button-row">
          <button className="button secondary" onClick={() => setCartOpen(true)} type="button">
            查看明细
          </button>
          <button className="button primary" disabled={!canCheckout} onClick={() => setCartOpen(true)} type="button">
            {canCheckout ? '去结算' : '暂不可下单'}
          </button>
        </div>
      </div>

      {cartOpen ? (
        <CartDrawer
          address={defaultAddressQuery.data}
          canCheckout={canCheckout}
          cartItems={cartItems}
          onAdd={(item) => addCartMutation.mutate({ dishId: item.dishId, setmealId: item.setmealId, dishFlavor: item.dishFlavor })}
          onClean={() => cleanCartMutation.mutate()}
          onClose={() => setCartOpen(false)}
          onRemarkChange={setRemark}
          onSubmit={() => submitOrderMutation.mutate()}
          onSub={(item) => subCartMutation.mutate({ dishId: item.dishId, setmealId: item.setmealId, dishFlavor: item.dishFlavor })}
          packAmount={packAmount}
          remark={remark}
          setPackAmount={setPackAmount}
          setTablewareNumber={setTablewareNumber}
          tablewareNumber={tablewareNumber}
        />
      ) : null}

      {pendingDish ? (
        <DishFlavorModal
          onClose={() => setPendingDish(null)}
          onConfirm={(selection) => {
            addCartMutation.mutate({
              dishId: pendingDish.dish.id,
              dishFlavor: buildFlavorSelection(pendingDish.dish.flavors, selection),
            });
            setPendingDish(null);
          }}
          selection={pendingDish}
        />
      ) : null}
    </div>
  );
}
