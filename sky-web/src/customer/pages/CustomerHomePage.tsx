import { useMemo, useState, useTransition } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { userApi, type AddressBook, type DishVO, type ShoppingCart } from '../../shared/api';
import {
  EmptyState,
  ErrorState,
  InlineNotice,
  LoadingState,
  MetricCard,
  type NoticeTone,
  PageHero,
  SectionTitle,
  StatusPill,
} from '../../shared/components';
import { appCopy } from '../../shared/copy';
import { useCustomerShell } from '../CustomerShell';
import {
  buildFlavorSelection,
  formatCurrency,
  formatNumber,
  getErrorMessage,
  normalizeImage,
  parseFlavorValues,
  summarizeCart,
} from '../../shared/utils';

interface DishSelectionState {
  dish: DishVO;
  values: Record<string, string>;
}

interface FeedbackState {
  title: string;
  body: string;
  tone: NoticeTone;
  action?: {
    label: string;
    to: string;
    state?: unknown;
  };
}

function CustomerJourney({
  hasCart,
  hasDefaultAddress,
  shopStatus,
}: {
  hasCart: boolean;
  hasDefaultAddress: boolean;
  shopStatus: number | null;
}) {
  const steps = [
    {
      title: appCopy.customerHome.journeyBrowseTitle,
      body: appCopy.customerHome.journeyBrowseBody,
      state: hasCart ? 'done' : 'active',
    },
    {
      title: appCopy.customerHome.journeyAddressTitle,
      body: appCopy.customerHome.journeyAddressBody,
      state: hasDefaultAddress ? 'done' : hasCart ? 'active' : 'locked',
    },
    {
      title: appCopy.customerHome.journeySubmitTitle,
      body: appCopy.customerHome.journeySubmitBody,
      state: hasCart && hasDefaultAddress && shopStatus === 1 ? 'active' : 'locked',
    },
    {
      title: appCopy.customerHome.journeyPayTitle,
      body: appCopy.customerHome.journeyPayBody,
      state: 'locked',
    },
  ] as const;

  return (
    <section className="panel section-card">
      <SectionTitle
        eyebrow="Checkout Map"
        eyebrowTone="support"
        title={appCopy.customerHome.journeyTitle}
        description={appCopy.customerHome.journeyDescription}
      />
      <div className="journey-grid">
        {steps.map((step, index) => (
          <article className={`journey-card journey-${step.state}`} key={step.title}>
            <span className="journey-index">0{index + 1}</span>
            <div className="stack" style={{ gap: 8 }}>
              <strong>{step.title}</strong>
              <span className="soft-copy">{step.body}</span>
            </div>
            <StatusPill
              tone={step.state === 'done' ? 'live' : step.state === 'active' ? 'demo' : 'warning'}
            >
              {step.state === 'done' ? '已准备' : step.state === 'active' ? '下一步' : '待完成'}
            </StatusPill>
          </article>
        ))}
      </div>
    </section>
  );
}

function FeedbackNotice({ feedback }: { feedback: FeedbackState | null }) {
  if (!feedback) {
    return null;
  }

  return (
    <InlineNotice
      actions={
        feedback.action ? (
          <Link className="button secondary small" state={feedback.action.state} to={feedback.action.to}>
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

function DishFlavorModal({
  selection,
  onClose,
  onConfirm,
}: {
  selection: DishSelectionState;
  onClose: () => void;
  onConfirm: (value: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => selection.values);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-header">
          <span className="eyebrow warning">Flavor Builder</span>
          <h3>{selection.dish.name}</h3>
          <p className="soft-copy">带口味的菜品会把当前规格拼成 `dishFlavor`，确保购物车和订单详情都能完整回显。</p>
        </div>

        <div className="stack">
          {selection.dish.flavors.map((flavor) => {
            const options = parseFlavorValues(flavor);
            return (
              <div className="field full" key={flavor.name}>
                <label htmlFor={flavor.name}>{flavor.name}</label>
                <select
                  id={flavor.name}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [flavor.name]: event.target.value,
                    }))
                  }
                  value={values[flavor.name] ?? options[0]}
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
          <button className="button primary" onClick={() => onConfirm(values)} type="button">
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
  feedback,
  isMutating,
  isSubmitting,
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
  feedback: FeedbackState | null;
  isMutating: boolean;
  isSubmitting: boolean;
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
          <h3>{appCopy.customerHome.cartTitle}</h3>
          <p className="soft-copy">{appCopy.customerHome.cartDescription}</p>
        </div>

        <FeedbackNotice feedback={feedback} />

        {!cartItems.length ? (
          <EmptyState body={appCopy.customerHome.emptyCartBody} title={appCopy.customerHome.emptyCartTitle} />
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
                    <button className="button secondary small" disabled={isMutating} onClick={() => onSub(item)} type="button">
                      -1
                    </button>
                    <button className="button secondary small" disabled={isMutating} onClick={() => onAdd(item)} type="button">
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
                <input
                  id="pack"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setPackAmount(event.target.value)}
                  step="0.5"
                  type="number"
                  value={packAmount}
                />
              </div>
            </div>

            <InlineNotice
              actions={
                !address ? (
                  <Link className="button secondary small" state={{ fromCheckout: true }} to="/customer/addresses">
                    {appCopy.customerHome.noDefaultAddressAction}
                  </Link>
                ) : undefined
              }
              body={
                address
                  ? `${address.provinceName}${address.cityName}${address.districtName}${address.detail}`
                  : appCopy.customerHome.noDefaultAddressBody
              }
              title={address ? appCopy.customerHome.addressReady(address.consignee) : appCopy.customerHome.noDefaultAddressTitle}
              tone={address ? 'live' : 'warning'}
            />

            <div className="row-between">
              <div className="stack" style={{ gap: 4 }}>
                <strong>应付总额 {formatCurrency(cartSummary.amount + Number(packAmount || 0))}</strong>
                <span className="soft-copy">{appCopy.customerHome.checkoutHint}</span>
              </div>
              <div className="button-row">
                <button className="button ghost" disabled={isMutating || isSubmitting} onClick={onClean} type="button">
                  {appCopy.customerHome.clearCart}
                </button>
                {!address ? (
                  <Link className="button secondary" state={{ fromCheckout: true }} to="/customer/addresses">
                    {appCopy.customerHome.noDefaultAddressAction}
                  </Link>
                ) : null}
                <button className="button primary" disabled={!canCheckout || !address || isSubmitting} onClick={onSubmit} type="button">
                  {isSubmitting ? appCopy.customerHome.submittingOrder : appCopy.customerHome.submitOrder}
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
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [, startDishTransition] = useTransition();
  const [, startSetmealTransition] = useTransition();

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

  const refreshCart = async () => {
    await queryClient.invalidateQueries({ queryKey: ['customer', 'cart'] });
  };

  const invalidateCustomerQueries = async () => {
    await Promise.all([
      refreshCart(),
      queryClient.invalidateQueries({ queryKey: ['customer', 'orders'] }),
      queryClient.invalidateQueries({ queryKey: ['customer', 'address'] }),
    ]);
  };

  const addCartMutation = useMutation({
    mutationFn: (payload: { dishId?: number; setmealId?: number; dishFlavor?: string }) => userApi.cartAdd(payload),
  });
  const subCartMutation = useMutation({
    mutationFn: (payload: { dishId?: number; setmealId?: number; dishFlavor?: string }) => userApi.cartSub(payload),
  });
  const cleanCartMutation = useMutation({
    mutationFn: () => userApi.cartClean(),
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
    onError: (error) => {
      setFeedback({
        title: '提交订单失败',
        body: getErrorMessage(error),
        tone: 'fallback',
      });
    },
    onSuccess: async (result) => {
      setCartOpen(false);
      setRemark('');
      setFeedback(null);
      await invalidateCustomerQueries();
      navigate('/customer/orders', {
        state: {
          flash: {
            title: appCopy.customerOrders.createdFromCheckoutTitle,
            body: appCopy.customerHome.submitSuccessBody(result.orderNumber),
            tone: 'live',
          },
        },
      });
    },
  });

  const cartItems = useMemo(() => cartQuery.data ?? [], [cartQuery.data]);
  const cartSummary = useMemo(() => summarizeCart(cartItems), [cartItems]);
  const hasDefaultAddress = Boolean(defaultAddressQuery.data);
  const canCheckout = cartSummary.count > 0 && shopStatus === 1 && hasDefaultAddress;
  const cartMutating = addCartMutation.isPending || subCartMutation.isPending || cleanCartMutation.isPending;
  const hasCatalogError =
    dishCategoriesQuery.isError ||
    setmealCategoriesQuery.isError ||
    cartQuery.isError ||
    dishesQuery.isError ||
    setmealsQuery.isError;

  const setActionError = (error: unknown, title = '操作失败') => {
    setFeedback({
      title,
      body: getErrorMessage(error),
      tone: 'fallback',
    });
  };

  const runAddCart = (payload: { dishId?: number; setmealId?: number; dishFlavor?: string }, label: string) => {
    addCartMutation.mutate(payload, {
      onError: (error) => setActionError(error, '加入购物车失败'),
      onSuccess: async () => {
        await refreshCart();
        setFeedback({
          title: appCopy.customerHome.addSuccessTitle,
          body: appCopy.customerHome.addSuccessBody(label),
          tone: 'live',
        });
      },
    });
  };

  const runSubCart = (item: ShoppingCart) => {
    subCartMutation.mutate(
      {
        dishId: item.dishId,
        setmealId: item.setmealId,
        dishFlavor: item.dishFlavor,
      },
      {
        onError: (error) => setActionError(error, '更新购物车失败'),
        onSuccess: async () => {
          await refreshCart();
          setFeedback({
            title: appCopy.customerHome.removeSuccessTitle,
            body: appCopy.customerHome.removeSuccessBody(item.name),
            tone: 'live',
          });
        },
      },
    );
  };

  const runCleanCart = () => {
    cleanCartMutation.mutate(undefined, {
      onError: (error) => setActionError(error, '清空购物车失败'),
      onSuccess: async () => {
        await refreshCart();
        setFeedback({
          title: appCopy.customerHome.clearSuccessTitle,
          body: appCopy.customerHome.clearSuccessBody,
          tone: 'live',
        });
      },
    });
  };

  const onAddDish = (dish: DishVO) => {
    if (dish.flavors.length) {
      const values = dish.flavors.reduce<Record<string, string>>((accumulator, flavor) => {
        accumulator[flavor.name] = parseFlavorValues(flavor)[0] ?? '';
        return accumulator;
      }, {});
      setPendingDish({ dish, values });
      return;
    }

    runAddCart({ dishId: dish.id }, dish.name);
  };

  return (
    <div className="page-grid">
      <PageHero
        eyebrow="Customer / Order Flow"
        title={appCopy.customerHome.heroTitle}
        description={appCopy.customerHome.heroDescription}
        actions={
          <>
            <button className="button primary" onClick={() => setCartOpen(true)} type="button">
              {appCopy.customerHome.openCart}
            </button>
            <Link className="button secondary" to="/customer/orders">
              {appCopy.customerHome.viewOrders}
            </Link>
          </>
        }
        aside={
          <div className="metrics-grid">
            <MetricCard hint={appCopy.customerHome.cartCountHint} label={appCopy.customerHome.cartCountLabel} value={formatNumber(cartSummary.count)} />
            <MetricCard
              hint={appCopy.customerHome.cartAmountHint}
              label={appCopy.customerHome.cartAmountLabel}
              tone="support"
              value={formatCurrency(cartSummary.amount)}
            />
            <MetricCard hint={appCopy.customerHome.addressHint} label={appCopy.customerHome.addressLabel} value={hasDefaultAddress ? '已就绪' : '未设置'} />
            <MetricCard hint={appCopy.customerHome.userHint} label={appCopy.customerHome.userLabel} value={currentUser ? `#${currentUser.id}` : '待连接'} />
          </div>
        }
      />

      {!cartOpen ? <FeedbackNotice feedback={feedback} /> : null}

      {shopStatus !== 1 ? (
        <InlineNotice body={appCopy.customerHome.shopClosedBody} title={appCopy.customerHome.shopClosedTitle} tone="warning" />
      ) : (
        <InlineNotice body={appCopy.customerHome.shopOpenBody} title={appCopy.customerHome.shopOpenTitle} tone="live" />
      )}

      {!hasDefaultAddress && cartSummary.count > 0 ? (
        <InlineNotice
          actions={
            <Link className="button secondary small" state={{ fromCheckout: true }} to="/customer/addresses">
              {appCopy.customerHome.noDefaultAddressAction}
            </Link>
          }
          body={appCopy.customerHome.noDefaultAddressBody}
          title={appCopy.customerHome.noDefaultAddressTitle}
          tone="warning"
        />
      ) : null}

      <CustomerJourney
        hasCart={cartSummary.count > 0}
        hasDefaultAddress={hasDefaultAddress}
        shopStatus={shopStatus}
      />

      {hasCatalogError ? (
        <ErrorState body={appCopy.customerHome.serviceErrorBody} title={appCopy.customerHome.serviceErrorTitle} />
      ) : (
        <div className="customer-grid">
          <section className="panel section-card">
            <SectionTitle
              eyebrow="Pick Dishes"
              title={appCopy.customerHome.dishSectionTitle}
              description={appCopy.customerHome.dishSectionDescription}
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
                        startDishTransition(() => {
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
                            <button className="button primary small" disabled={cartMutating} onClick={() => onAddDish(dish)} type="button">
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
              title={appCopy.customerHome.setmealSectionTitle}
              description={appCopy.customerHome.setmealSectionDescription}
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
                        startSetmealTransition(() => {
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
                          disabled={cartMutating}
                          onClick={() => runAddCart({ setmealId: setmeal.id }, setmeal.name)}
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
          <span className="soft-copy">当前金额 {formatCurrency(cartSummary.amount)}，默认地址 {hasDefaultAddress ? '已准备好' : '还没设置'}。</span>
        </div>
        <div className="button-row">
          <button className="button secondary" onClick={() => setCartOpen(true)} type="button">
            {appCopy.customerHome.stickyDetails}
          </button>
          {cartSummary.count === 0 ? (
            <button className="button primary" disabled type="button">
              {appCopy.customerHome.stickyEmpty}
            </button>
          ) : !hasDefaultAddress && shopStatus === 1 ? (
            <Link className="button primary" state={{ fromCheckout: true }} to="/customer/addresses">
              {appCopy.customerHome.stickyAddressAction}
            </Link>
          ) : (
            <button className="button primary" disabled={!canCheckout} onClick={() => setCartOpen(true)} type="button">
              {canCheckout ? appCopy.customerHome.stickyCheckout : appCopy.customerHome.stickyClosed}
            </button>
          )}
        </div>
      </div>

      {cartOpen ? (
        <CartDrawer
          address={defaultAddressQuery.data}
          canCheckout={canCheckout}
          cartItems={cartItems}
          feedback={feedback}
          isMutating={cartMutating}
          isSubmitting={submitOrderMutation.isPending}
          onAdd={(item) =>
            runAddCart(
              {
                dishId: item.dishId,
                setmealId: item.setmealId,
                dishFlavor: item.dishFlavor,
              },
              item.name,
            )
          }
          onClean={runCleanCart}
          onClose={() => setCartOpen(false)}
          onRemarkChange={setRemark}
          onSubmit={() => submitOrderMutation.mutate()}
          onSub={(item) => runSubCart(item)}
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
            runAddCart(
              {
                dishId: pendingDish.dish.id,
                dishFlavor: buildFlavorSelection(pendingDish.dish.flavors, selection),
              },
              pendingDish.dish.name,
            );
            setPendingDish(null);
          }}
          selection={pendingDish}
        />
      ) : null}
    </div>
  );
}
