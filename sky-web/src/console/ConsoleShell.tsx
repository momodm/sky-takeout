 /* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { adminApi } from '../shared/api';
import { AvatarChip, InlineNotice, StatusPill } from '../shared/components';
import { appCopy } from '../shared/copy';
import {
  clearAdminSession,
  getAdminProfile,
  getConsoleViewMode,
  setConsoleViewMode,
  type ConsoleViewMode,
} from '../shared/storage';
import { getShopStatusLabel } from '../shared/utils';

interface ConsoleShellContextValue {
  viewMode: ConsoleViewMode;
  setViewMode: (mode: ConsoleViewMode) => void;
  shopStatus: number | null;
}

const ConsoleShellContext = createContext<ConsoleShellContextValue | null>(null);

export function useConsoleShell() {
  const context = useContext(ConsoleShellContext);
  if (!context) {
    throw new Error('Console shell context is unavailable');
  }
  return context;
}

function ConsoleContextProvider({ children, value }: { children: ReactNode; value: ConsoleShellContextValue }) {
  return <ConsoleShellContext.Provider value={value}>{children}</ConsoleShellContext.Provider>;
}

export function ConsoleShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, updateViewMode] = useState<ConsoleViewMode>(getConsoleViewMode());
  const profile = getAdminProfile();
  const shopStatusQuery = useQuery({
    queryKey: ['console', 'shop-status'],
    queryFn: () => adminApi.shopStatus(),
  });

  const contextValue = useMemo<ConsoleShellContextValue>(
    () => ({
      viewMode,
      setViewMode: (mode) => {
        setConsoleViewMode(mode);
        updateViewMode(mode);
      },
      shopStatus: shopStatusQuery.data ?? null,
    }),
    [shopStatusQuery.data, viewMode],
  );

  const navItems = [
    { to: '/console/workspace', label: appCopy.consoleShell.nav.workspace },
    { to: '/console/orders', label: appCopy.consoleShell.nav.orders },
    ...(viewMode === 'admin' ? [{ to: '/console/categories', label: appCopy.consoleShell.nav.categories }] : []),
    { to: '/console/dishes', label: appCopy.consoleShell.nav.dishes },
    { to: '/console/setmeals', label: appCopy.consoleShell.nav.setmeals },
    { to: '/console/shop', label: appCopy.consoleShell.nav.shop },
    { to: '/console/reports', label: appCopy.consoleShell.nav.reports },
    ...(viewMode === 'admin' ? [{ to: '/console/employees', label: appCopy.consoleShell.nav.employees }] : []),
  ];

  useEffect(() => {
    const adminOnlyPaths = ['/console/categories', '/console/employees'];
    if (viewMode === 'merchant' && adminOnlyPaths.includes(location.pathname)) {
      navigate('/console/workspace', { replace: true });
    }
  }, [location.pathname, navigate, viewMode]);

  return (
    <ConsoleContextProvider value={contextValue}>
      <div className="mode-console">
        <div className="app-shell console-shell">
          <div className="console-frame">
            <aside className="console-sidebar panel">
              <div className="sidebar-block">
                <span className="eyebrow support">{appCopy.consoleShell.eyebrow}</span>
                <strong style={{ fontSize: 24 }}>{appCopy.consoleShell.title}</strong>
                <span className="soft-copy">{appCopy.consoleShell.description}</span>
              </div>

              <div className="sidebar-block">
                <span className="sidebar-heading">{appCopy.consoleShell.modeTitle}</span>
                <div className="console-toggle">
                  <button className={viewMode === 'merchant' ? 'active' : ''} onClick={() => contextValue.setViewMode('merchant')} type="button">
                    {appCopy.consoleShell.merchantMode}
                  </button>
                  <button className={viewMode === 'admin' ? 'active' : ''} onClick={() => contextValue.setViewMode('admin')} type="button">
                    {appCopy.consoleShell.adminMode}
                  </button>
                </div>
                <StatusPill tone={shopStatusQuery.data === 1 ? 'live' : 'warning'}>
                  {getShopStatusLabel(shopStatusQuery.data)}
                </StatusPill>
              </div>

              <nav className="sidebar-block">
                <span className="sidebar-heading">{appCopy.consoleShell.navTitle}</span>
                {navItems.map((item) => (
                  <NavLink className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} key={item.to} to={item.to}>
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="sidebar-block">
                <span className="sidebar-heading">{appCopy.consoleShell.profileTitle}</span>
                {profile ? (
                  <AvatarChip subtitle={profile.userName} title={profile.name} />
                ) : (
                  <InlineNotice
                    body={appCopy.consoleShell.missingProfileBody}
                    title={appCopy.consoleShell.missingProfileTitle}
                    tone="warning"
                  />
                )}
              </div>

              <button
                className="button secondary"
                onClick={() => {
                  clearAdminSession();
                  navigate('/console/login', { replace: true });
                }}
                type="button"
              >
                {appCopy.consoleShell.logout}
              </button>
            </aside>

            <main className="console-main">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </ConsoleContextProvider>
  );
}
