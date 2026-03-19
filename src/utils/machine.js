/**
 * src/utils/machine.js
 * Funções utilitárias puras para derivar informações de máquinas.
 */

/** Mapeamento de status → cor CSS variable */
export const STATUS_COLOR = {
  'Operando':    'var(--accent)',
  'Alerta':      'var(--danger)',
  'Temp. Alta':  'var(--danger)',
  'Em atenção':  'var(--warning)',
  'Atenção':     'var(--warning)',
  'Offline':     'var(--muted)',
  'Parada':      'var(--muted)',
  'Lubrificação':'var(--warning)',
  'Instabilidade':'var(--warning)',
  'Falta de energia': 'var(--danger)',
};

export function getStatusColor(status) {
  return STATUS_COLOR[status] ?? 'var(--muted)';
}

/** Badge CSS class por status */
export function getStatusClass(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('operad')) return 'status--ok';
  if (s.includes('alerta') || s.includes('temp') || s.includes('energia')) return 'status--danger';
  if (s.includes('aten') || s.includes('lubri') || s.includes('instab')) return 'status--warn';
  return 'status--off';
}

/**
 * Extrai o último registro de sensores de `dados[]`.
 * Retorna { rpm, potencia, temperatura } ou zeros.
 */
export function getLatestSensorData(machine) {
  const dados = machine?.dados;
  if (!Array.isArray(dados) || dados.length === 0) {
    return { rpm: 0, potencia: 0, temperatura: 0 };
  }
  const last = dados[dados.length - 1];
  return {
    rpm:        last.rpm        ?? 0,
    potencia:   last.potencia   ?? 0,
    temperatura: last.temperatura ?? 0,
  };
}

/**
 * Agrupa máquinas por status para os KPI cards do dashboard.
 */
export function groupByStatus(machines) {
  return machines.reduce(
    (acc, m) => {
      const s = (m.status || '').toLowerCase();
      if (s.includes('operad'))                                   acc.operando++;
      else if (s.includes('alerta') || s.includes('temp') || s.includes('energia')) acc.alerta++;
      else if (s.includes('aten') || s.includes('lubri') || s.includes('instab'))   acc.atencao++;
      else                                                         acc.offline++;
      return acc;
    },
    { operando: 0, alerta: 0, atencao: 0, offline: 0 }
  );
}

/**
 * Conta a frequência de cada tipo de alerta para o donut chart.
 */
export function countAlerts(machines) {
  const counts = {};
  machines.forEach((m) => {
    (m.alertas || []).forEach((a) => {
      counts[a] = (counts[a] || 0) + 1;
    });
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

/** Formata timestamp ISO para horário legível */
export function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });
}

/** Formata timestamp ISO para data + horário */
export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Filtra máquinas por texto (nome/codigo/local) e por local selecionado.
 */
export function filterMachines(machines, { search = '', local = '' }) {
  return machines.filter((m) => {
    const hay = `${m.codigo} ${m.nome || ''} ${m.local}`.toLowerCase();
    const matchSearch = !search || hay.includes(search.toLowerCase());
    const matchLocal  = !local  || m.local === local;
    return matchSearch && matchLocal;
  });
}

/** Extrai lista única de locais */
export function getLocations(machines) {
  return [...new Set(machines.map((m) => m.local).filter(Boolean))].sort();
}

/**
 * Calcula métricas de eficiência a partir do histórico de dados.
 * Retorna porcentagens de tempo em cada estado (mock baseado nos alertas).
 */
export function calcEfficiency(machine) {
  const total = (machine?.dados || []).length || 1;
  const alertCount = (machine?.alertas || []).length;
  const operando = Math.max(0, 100 - alertCount * 12);
  return {
    operando,
    atencao: Math.min(20, alertCount * 8),
    alerta:  Math.min(15, alertCount * 4),
    eficiencia: Math.round(operando * 0.95),
  };
}
