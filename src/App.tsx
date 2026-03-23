/**
 * src/App.tsx
 * Componente raiz — gerencia qual página está ativa.
 */
import React, { useMemo, useState } from 'react';
import Navbar    from './components/Navbar/Navbar';
import Dashboard from './pages/Dashboard/Dashboard';
import Reports   from './pages/Reports/Reports';
import { useMachines } from './hooks/useMachines';

type Page = 'Dashboard' | 'Relatórios';

export default function App(): React.ReactElement {
  const { machines, loading, error, refetch, update, lastFetch, previousCounts } = useMachines();
  const [activePage, setActivePage] = useState<Page>('Dashboard');

  const alertCount = useMemo(
    () => machines.filter((m) => m.alertas?.length > 0).length,
    [machines]
  );

  return (
    <>
      <Navbar
        onRefresh={refetch}
        loading={loading}
        lastFetch={lastFetch}
        alertCount={alertCount}
        activePage={activePage}
        onNavChange={(p) => setActivePage(p as Page)}
      />

      {activePage === 'Dashboard' ? (
        <Dashboard
          machines={machines}
          loading={loading}
          error={error}
          onRefetch={refetch}
          onUpdate={update}
          previousCounts={previousCounts}
        />
      ) : (
        <Reports
          machines={machines}
          loading={loading}
          error={error}
          onRefetch={refetch}
        />
      )}
    </>
  );
}