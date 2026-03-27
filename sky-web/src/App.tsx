import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { CustomerShell } from './customer/CustomerShell';
import { ConsoleShell } from './console/ConsoleShell';
import { LoadingState } from './shared/components';
import { appCopy } from './shared/copy';
import { getAdminToken, getConsoleViewMode } from './shared/storage';

const CustomerHomePage = lazy(() =>
  import('./customer/pages/CustomerHomePage').then((module) => ({ default: module.CustomerHomePage })),
);
const CustomerOrdersPage = lazy(() =>
  import('./customer/pages/CustomerOrdersPage').then((module) => ({ default: module.CustomerOrdersPage })),
);
const CustomerAddressBookPage = lazy(() =>
  import('./customer/pages/CustomerAddressBookPage').then((module) => ({ default: module.CustomerAddressBookPage })),
);
const CustomerProfilePage = lazy(() =>
  import('./customer/pages/CustomerProfilePage').then((module) => ({ default: module.CustomerProfilePage })),
);

const ConsoleLoginPage = lazy(() =>
  import('./console/pages/ConsoleLoginPage').then((module) => ({ default: module.ConsoleLoginPage })),
);
const ConsoleWorkspacePage = lazy(() =>
  import('./console/pages/ConsoleWorkspacePage').then((module) => ({ default: module.ConsoleWorkspacePage })),
);
const ConsoleOrdersPage = lazy(() =>
  import('./console/pages/ConsoleOrdersPage').then((module) => ({ default: module.ConsoleOrdersPage })),
);
const ConsoleCatalogPage = lazy(() =>
  import('./console/pages/ConsoleCatalogPage').then((module) => ({ default: module.ConsoleCatalogPage })),
);
const ConsoleCategoriesPage = lazy(() =>
  import('./console/pages/ConsoleCategoriesPage').then((module) => ({ default: module.ConsoleCategoriesPage })),
);
const ConsoleDishesPage = lazy(() =>
  import('./console/pages/ConsoleDishesPage').then((module) => ({ default: module.ConsoleDishesPage })),
);
const ConsoleSetmealsPage = lazy(() =>
  import('./console/pages/ConsoleSetmealsPage').then((module) => ({ default: module.ConsoleSetmealsPage })),
);
const ConsoleShopPage = lazy(() =>
  import('./console/pages/ConsoleShopPage').then((module) => ({ default: module.ConsoleShopPage })),
);
const ConsoleReportsPage = lazy(() =>
  import('./console/pages/ConsoleReportsPage').then((module) => ({ default: module.ConsoleReportsPage })),
);
const ConsoleEmployeesPage = lazy(() =>
  import('./console/pages/ConsoleEmployeesPage').then((module) => ({ default: module.ConsoleEmployeesPage })),
);

function ConsoleGate() {
  const location = useLocation();

  if (!getAdminToken()) {
    return <Navigate replace state={{ from: location.pathname }} to="/console/login" />;
  }

  return <Outlet />;
}

function ConsoleAdminGate() {
  if (getConsoleViewMode() !== 'admin') {
    return <Navigate replace to="/console/workspace" />;
  }

  return <Outlet />;
}

function NotFoundPage() {
  return (
    <main className="not-found-shell">
      <div className="not-found-card panel">
        <span className="eyebrow">{appCopy.notFound.eyebrow}</span>
        <h1>{appCopy.notFound.title}</h1>
        <p>{appCopy.notFound.description}</p>
        <div className="hero-actions">
          <a className="button primary" href="/customer">
            {appCopy.notFound.customerAction}
          </a>
          <a className="button secondary" href="/console">
            {appCopy.notFound.consoleAction}
          </a>
        </div>
      </div>
    </main>
  );
}

function App() {
  return (
    <Suspense fallback={<LoadingState body="正在按路由懒加载页面资源。" title="正在展开前端界面" />}>
      <Routes>
        <Route element={<Navigate replace to="/customer" />} path="/" />

        <Route element={<CustomerShell />} path="/customer">
          <Route element={<CustomerHomePage />} index />
          <Route element={<CustomerOrdersPage />} path="orders" />
          <Route element={<CustomerAddressBookPage />} path="addresses" />
          <Route element={<CustomerProfilePage />} path="profile" />
        </Route>

        <Route element={<ConsoleLoginPage />} path="/console/login" />
        <Route element={<ConsoleGate />}>
          <Route element={<ConsoleShell />} path="/console">
            <Route element={<Navigate replace to="workspace" />} index />
            <Route element={<ConsoleWorkspacePage />} path="workspace" />
            <Route element={<ConsoleOrdersPage />} path="orders" />
            <Route element={<ConsoleCatalogPage />} path="catalog" />
            <Route element={<ConsoleDishesPage />} path="dishes" />
            <Route element={<ConsoleSetmealsPage />} path="setmeals" />
            <Route element={<ConsoleShopPage />} path="shop" />
            <Route element={<ConsoleReportsPage />} path="reports" />
            <Route element={<ConsoleAdminGate />}>
              <Route element={<ConsoleCategoriesPage />} path="categories" />
              <Route element={<ConsoleEmployeesPage />} path="employees" />
            </Route>
          </Route>
        </Route>

        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </Suspense>
  );
}

export default App;
