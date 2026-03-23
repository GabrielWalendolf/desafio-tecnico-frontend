/**
 * src/App.js
 * Componente raiz da aplicação ECO+ Machines.
 * Conecta o hook de dados com os componentes de layout.
 */
import React, { useMemo } from 'react';
import Navbar    from './components/Navbar/Navbar';
import Dashboard from './pages/Dashboard/Dashboard';
import { useMachines } from './hooks/useMachines';

export default function App() {
  const { machines, loading, error, refetch, update, lastFetch, previousCounts } = useMachines();

  /* Conta máquinas com pelo menos 1 alerta ativo */
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