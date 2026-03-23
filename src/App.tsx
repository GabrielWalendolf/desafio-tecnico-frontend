/**
 * src/App.tsx
 * Componente raiz da aplicação ECO+ Machines.
 */
import React, { useMemo } from 'react';
import Navbar    from './components/Navbar/Navbar';
import Dashboard from './pages/Dashboard/Dashboard';
import { useMachines } from './hooks/useMachines';

export default function App(): React.ReactElement {
  const { machines, loading, error, refetch, update, lastFetch, previousCounts } = useMachines();

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
      />
      <Dashboard
        machines={machines}
        loading={loading}
        error={error}
        onRefetch={refetch}
        onUpdate={update}
        previousCounts={previousCounts}
      />
    </>
  );
}
