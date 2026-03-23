/**
 * src/utils/machine.test.js
 * Testes unitários para as funções utilitárias de máquinas.
 */
import {
  getStatusClass,
  getLatestSensorData,
  groupByStatus,
  countAlerts,
  filterMachines,
  getLocations,
  sortMachines,
  calcEfficiency,
  formatDateTime,
} from './machine';

// ── Fixtures ──────────────────────────────────────────────────
const makeMachine = (overrides = {}) => ({
  id: 1,
  codigo: 'Torno CNC 101',
  local: 'Setor A',
  status: 'Operando',
  alertas: [],
  ultimaAtualizacao: '2026-03-17T14:00:00-03:00',
  dados: [
    { timestamp: '2026-03-17T13:55:00-03:00', rpm: 2000, potencia: 500, temperatura: 40 },
    { timestamp: '2026-03-17T14:00:00-03:00', rpm: 2100, potencia: 550, temperatura: 42 },
  ],
  ...overrides,
});

// ── getStatusClass ─────────────────────────────────────────────
describe('getStatusClass', () => {
  it('retorna status--ok para Operando', () => {
    expect(getStatusClass('Operando')).toBe('status--ok');
  });

  it('retorna status--danger para Temp. Alta', () => {
    expect(getStatusClass('Temp. Alta')).toBe('status--danger');
  });

  it('retorna status--warn para Vibração Alta', () => {
    expect(getStatusClass('Vibração Alta')).toBe('status--warn');
  });

  it('retorna status--off para Manutenção', () => {
    expect(getStatusClass('Manutenção')).toBe('status--off');
  });

  it('retorna status--off para status desconhecido', () => {
    expect(getStatusClass('Status Inexistente')).toBe('status--off');
  });
});

// ── getLatestSensorData ────────────────────────────────────────
describe('getLatestSensorData', () => {
  it('retorna o último registro de dados', () => {
    const machine = makeMachine();
    expect(getLatestSensorData(machine)).toEqual({
      rpm: 2100,
      potencia: 550,
      temperatura: 42,
    });
  });

  it('retorna zeros quando dados está vazio', () => {
    const machine = makeMachine({ dados: [] });
    expect(getLatestSensorData(machine)).toEqual({
      rpm: 0,
      potencia: 0,
      temperatura: 0,
    });
  });

  it('retorna zeros quando dados é undefined', () => {
    const machine = makeMachine({ dados: undefined });
    expect(getLatestSensorData(machine)).toEqual({
      rpm: 0,
      potencia: 0,
      temperatura: 0,
    });
  });
});

// ── groupByStatus ──────────────────────────────────────────────
describe('groupByStatus', () => {
  it('agrupa máquinas corretamente por categoria', () => {
    const machines = [
      makeMachine({ status: 'Operando' }),
      makeMachine({ status: 'Operando' }),
      makeMachine({ status: 'Temp. Alta' }),
      makeMachine({ status: 'Vibração Alta' }),
      makeMachine({ status: 'Manutenção' }),
    ];

    expect(groupByStatus(machines)).toEqual({
      operando: 2,
      alerta:   1,
      atencao:  1,
      offline:  1,
    });
  });

  it('retorna zeros para lista vazia', () => {
    expect(groupByStatus([])).toEqual({
      operando: 0,
      alerta:   0,
      atencao:  0,
      offline:  0,
    });
  });
});

// ── countAlerts ────────────────────────────────────────────────
describe('countAlerts', () => {
  it('conta a frequência de cada tipo de alerta', () => {
    const machines = [
      makeMachine({ alertas: ['Temp. Alta', 'Vibração Alta'] }),
      makeMachine({ alertas: ['Temp. Alta'] }),
      makeMachine({ alertas: [] }),
    ];

    const result = countAlerts(machines);
    const tempAlta    = result.find((r) => r.name === 'Temp. Alta');
    const vibracaoAlta = result.find((r) => r.name === 'Vibração Alta');

    expect(tempAlta?.value).toBe(2);
    expect(vibracaoAlta?.value).toBe(1);
  });

  it('retorna array vazio quando não há alertas', () => {
    const machines = [makeMachine({ alertas: [] })];
    expect(countAlerts(machines)).toEqual([]);
  });
});

// ── filterMachines ─────────────────────────────────────────────
describe('filterMachines', () => {
  const machines = [
    makeMachine({ id: 1, codigo: 'Torno CNC 101', local: 'Setor A' }),
    makeMachine({ id: 2, codigo: 'Máquina CNC 203', local: 'Setor B' }),
    makeMachine({ id: 3, codigo: 'Fresadora 305', local: 'Setor A' }),
  ];

  it('filtra por texto no nome', () => {
    const result = filterMachines(machines, { search: 'torno' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('filtra por local', () => {
    const result = filterMachines(machines, { local: 'Setor A' });
    expect(result).toHaveLength(2);
  });

  it('combina filtro de texto e local', () => {
    const result = filterMachines(machines, { search: 'fresadora', local: 'Setor A' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });

  it('retorna todos quando filtros estão vazios', () => {
    const result = filterMachines(machines, { search: '', local: '' });
    expect(result).toHaveLength(3);
  });

  it('retorna vazio quando nenhuma máquina corresponde', () => {
    const result = filterMachines(machines, { search: 'xyz_inexistente' });
    expect(result).toHaveLength(0);
  });
});

// ── getLocations ───────────────────────────────────────────────
describe('getLocations', () => {
  it('retorna lista única de locais ordenada', () => {
    const machines = [
      makeMachine({ local: 'Setor B' }),
      makeMachine({ local: 'Setor A' }),
      makeMachine({ local: 'Setor B' }),
    ];
    expect(getLocations(machines)).toEqual(['Setor A', 'Setor B']);
  });

  it('retorna array vazio para lista vazia', () => {
    expect(getLocations([])).toEqual([]);
  });
});

// ── sortMachines ───────────────────────────────────────────────
describe('sortMachines', () => {
  it('ordena: alerta → atencao → offline → operando', () => {
    const machines = [
      makeMachine({ id: 1, status: 'Operando' }),
      makeMachine({ id: 2, status: 'Manutenção' }),
      makeMachine({ id: 3, status: 'Vibração Alta' }),
      makeMachine({ id: 4, status: 'Temp. Alta' }),
    ];

    const sorted = sortMachines(machines);
    expect(sorted[0].id).toBe(4); // alerta
    expect(sorted[1].id).toBe(3); // atencao
    expect(sorted[2].id).toBe(2); // offline
    expect(sorted[3].id).toBe(1); // operando
  });
});

// ── calcEfficiency ─────────────────────────────────────────────
describe('calcEfficiency', () => {
  it('retorna 100% operando para máquina sem alertas', () => {
    const machine = makeMachine({ alertas: [] });
    const result = calcEfficiency(machine);
    expect(result.operando).toBe(100);
    expect(result.alerta).toBe(0);
  });

  it('reduz operando conforme número de alertas', () => {
    const machine = makeMachine({ alertas: ['Temp. Alta', 'Vibração Alta'] });
    const result = calcEfficiency(machine);
    expect(result.operando).toBeLessThan(100);
  });

  it('retorna eficiência como número entre 0 e 100', () => {
    const machine = makeMachine({ alertas: ['Temp. Alta'] });
    const { eficiencia } = calcEfficiency(machine);
    expect(eficiencia).toBeGreaterThanOrEqual(0);
    expect(eficiencia).toBeLessThanOrEqual(100);
  });
});

// ── formatDateTime ─────────────────────────────────────────────
describe('formatDateTime', () => {
  it('retorna "—" para valor nulo', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
  });

  it('formata uma data ISO corretamente', () => {
    const result = formatDateTime('2026-03-17T14:00:00-03:00');
    expect(result).toContain('17');
    expect(result).toContain('2026');
  });
});