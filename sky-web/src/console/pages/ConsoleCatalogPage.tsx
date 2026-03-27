import { Navigate } from 'react-router-dom';

export function ConsoleCatalogPage() {
  // 保留旧路由入口，避免历史链接失效。
  return <Navigate replace to="/console/dishes" />;
}
