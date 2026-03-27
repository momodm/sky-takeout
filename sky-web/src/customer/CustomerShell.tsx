/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { NavLink, Outlet } from 'react-router-dom';
import { userApi, type User } from '../shared/api';
import { InlineNotice, LoadingState, StatusPill } from '../shared/components';
import { appCopy } from '../shared/copy';
import { clearUserToken, getUserToken, setUserToken } from '../shared/storage';
import { createMockCode, getShopStatusLabel } from '../shared/utils';

interface CustomerShellContextValue {
  currentUser: User | null;
  shopStatus: number | null;
  sessionReady: boolean;
}

const CustomerShellContext = createContext<CustomerShellContextValue | null>(null);

export function useCustomerShell() {
  const context = useContext(CustomerShellContext);
  if (!context) {
    throw new Error('Customer shell context is unavailable');
  }
  return context;
}

function CustomerContextProvider({ children, value }: { children: ReactNode; value: CustomerShellContextValue }) {
  return <CustomerShellContext.Provider value={value}>{children}</CustomerShellContext.Provider>;
}

export function CustomerShell() {
  const bootstrapRef = useRef(false);
  const bootstrapMutation = useMutation({
    mutationFn: async () => {
      const session = await userApi.login(createMockCode());
      setUserToken(session.token);
      return session;
    },
    onError: () => {
      clearUserToken();
    },
  });

  const currentUserQuery = useQuery({
    queryKey: ['customer', 'current', getUserToken()],
    queryFn: () => userApi.current(),
    enabled: Boolean(getUserToken()),
  });

  const shopStatusQuery = useQuery({
    queryKey: ['customer', 'shop-status'],
    queryFn: () => userApi.shopStatus(),
  });

  useEffect(() => {
    if (getUserToken() || bootstrapRef.current) {
      return;
    }

    bootstrapRef.current = true;
    bootstrapMutation.mutate();
  }, [bootstrapMutation]);

  const sessionReady = Boolean(getUserToken()) && !currentUserQuery.isLoading;
  const contextValue = useMemo<CustomerShellContextValue>(
    () => ({
      currentUser: currentUserQuery.data ?? null,
      shopStatus: shopStatusQuery.data ?? null,
      sessionReady,
    }),
    [currentUserQuery.data, sessionReady, shopStatusQuery.data],
  );

  return (
    <CustomerContextProvider value={contextValue}>
      <div className="mode-customer">
        <div className="app-shell">
          <header className="panel section-card">
            <div className="row-between">
              <div className="stack" style={{ gap: 8 }}>
                <span className="eyebrow">{appCopy.customerShell.eyebrow}</span>
                <div className="stack" style={{ gap: 4 }}>
                  <strong style={{ fontSize: 24 }}>{appCopy.customerShell.title}</strong>
                  <span className="soft-copy">{appCopy.customerShell.description}</span>
                </div>
              </div>
              <div className="stack" style={{ justifyItems: 'end' }}>
                <StatusPill tone={shopStatusQuery.data === 1 ? 'live' : 'warning'}>
                  门店状态：{getShopStatusLabel(shopStatusQuery.data)}
                </StatusPill>
                {currentUserQuery.data ? (
                  <span className="inline-meta">{appCopy.customerShell.sessionReady}：{currentUserQuery.data.id}</span>
                ) : (
                  <span className="inline-meta">{appCopy.customerShell.sessionPending}</span>
                )}
              </div>
            </div>
            <nav className="customer-nav">
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end to="/customer">
                {appCopy.customerShell.nav.home}
              </NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/customer/orders">
                {appCopy.customerShell.nav.orders}
              </NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/customer/addresses">
                {appCopy.customerShell.nav.addresses}
              </NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/customer/profile">
                {appCopy.customerShell.nav.profile}
              </NavLink>
            </nav>
            {bootstrapMutation.isPending ? (
              <InlineNotice body={appCopy.customerShell.connectBody} title={appCopy.customerShell.connectTitle} tone="live" />
            ) : null}
            {bootstrapMutation.isError ? (
              <InlineNotice body={appCopy.customerShell.errorBody} title={appCopy.customerShell.errorTitle} tone="fallback" />
            ) : null}
          </header>

          {!sessionReady && !bootstrapMutation.isError ? (
            <LoadingState body={appCopy.customerShell.loadingBody} title={appCopy.customerShell.loadingTitle} />
          ) : (
            <Outlet />
          )}
        </div>
      </div>
    </CustomerContextProvider>
  );
}
