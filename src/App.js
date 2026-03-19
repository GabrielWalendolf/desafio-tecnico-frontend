/**
 * src/App.js
 * Componente raiz da aplicação ECO+ Machines.
 * Conecta o hook de dados com os componentes de layout.
 */
import React from 'react';
import Navbar    from './components/Navbar/Navbar';
import Dashboard from './pages/Dashboard/Dashboard';
import { useMachines } from './hooks/useMachines';

export default function App() {
  const { machines, loading, error, refetch, update, lastFetch } = useMachines();

  return (
    <>
      <Navbar
        onRefresh={refetch}
        loading={loading}
        lastFetch={lastFetch}
      />
      <Dashboard
        machines={machines}
        loading={loading}
        error={error}
        onRefetch={refetch}
        onUpdate={update}
      />
    </>
  );
}
