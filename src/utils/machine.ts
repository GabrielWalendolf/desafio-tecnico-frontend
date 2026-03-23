/**
 * src/utils/machine.ts
 * Funções utilitárias puras para derivar informações de máquinas.
 */
import {
  getStatusCategory,
  CATEGORY_CSS_CLASS,
  STATUS_SORT_ORDER,
} from '../constants/statusMap';
import {
  Machine,
  SensorReading,
  StatusCounts,
  AlertChartEntry,
  EfficiencyData,
} from '../types';

export const STATUS_COLOR: Record<string, string> = {
  'Operando':           'var(--accent)',
  'Alerta':             'var(--danger)',
  'Temp. Alta':         'var(--danger)',
  'Lubrificação':       'var(--warning)',
  'Alerta de Potência': 'var(--danger)',
  'Baixa Produção':     'var(--warning)',
  'Vibração Alta':      'var(--warning)',
  'Parada':             'var(--muted)',
  'Manutenção':         'var(--muted)',
};

export function getStatusColor(status: string): string {
  return STATUS_COLOR[status] ?? 'var(--muted)';
}

export function getStatusClass(status: string): string {
  const category = getStatusCategory(status);
  return CATEGORY_CSS_CLASS[category];
}

export function getLatestSensorData(machine: Machine): SensorReading {
  const dados = machine?.dados;
  if (!Array.isArray(dados) || dados.length === 0) {
    return { timestamp: '', rpm: 0, potencia: 0, temperatura: 0 };
  }
  const last = dados[dados.length - 1];
  return {
    timestamp:   last.timestamp   ?? '',
    rpm:         last.rpm         ?? 0,
    potencia:    last.potencia    ?? 0,
    temperatura: last.temperatura ?? 0,
  };
}

export function groupByStatus(machines: Machine[]): StatusCounts {
  return machines.reduce<StatusCounts>(
    (acc, m) => {
      const category = getStatusCategory(m.status);
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    },
    { operando: 0, alerta: 0, atencao: 0, offline: 0 }
  );
}

export function countAlerts(machines: Machine[]): AlertChartEntry[] {
  const counts: Record<string, number> = {};
  machines.forEach((m) => {
    (m.alertas || []).forEach((a) => {
      counts[a] = (counts[a] || 0) + 1;
    });
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export interface FilterOptions {
  search?: string;
  local?: string;
}

export function filterMachines(machines: Machine[], { search = '', local = '' }: FilterOptions): Machine[] {
  return machines.filter((m) => {
    const hay = `${m.codigo} ${m.nome ?? ''} ${m.local}`.toLowerCase();
    const matchSearch = !search || hay.includes(search.toLowerCase());
    const matchLocal  = !local  || m.local === local;
    return matchSearch && matchLocal;
  });
}

export function getLocations(machines: Machine[]): string[] {
  return [...new Set(machines.map((m) => m.local).filter(Boolean))].sort();
}

export function sortMachines(machines: Machine[]): Machine[] {
  return [...machines].sort((a, b) => {
    const orderA = STATUS_SORT_ORDER[getStatusCategory(a.status)] ?? 99;
    const orderB = STATUS_SORT_ORDER[getStatusCategory(b.status)] ?? 99;
    return orderA - orderB;
  });
}

export function calcEfficiency(machine: Machine): EfficiencyData {
  const alertCount = (machine?.alertas || []).length;
  const operando   = Math.max(0, 100 - alertCount * 12);
  return {
    operando,
    atencao:    Math.min(20, alertCount * 8),
    alerta:     Math.min(15, alertCount * 4),
    eficiencia: Math.round(operando * 0.95),
  };
}
