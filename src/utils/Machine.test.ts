/**
 * src/utils/machine.test.ts
 */
import {
  getStatusClass, getLatestSensorData, groupByStatus,
  countAlerts, filterMachines, getLocations,
  sortMachines, calcEfficiency, formatDateTime,
} from './machine';
import { Machine } from '../types';

const makeMachine = (overrides: Partial<Machine> = {}): Machine => ({
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

describe('getStatusClass', () => {
  it('retorna status--ok para Operando',        () => expect(getStatusClass('Operando')).toBe('status--ok'));
  it('retorna status--danger para Temp. Alta',  () => expect(getStatusClass('Temp. Alta')).toBe('status--danger'));
  it('retorna status--warn para Vibração Alta', () => expect(getStatusClass('Vibração Alta')).toBe('status--warn'));
  it('retorna status--off para Manutenção',     () => expect(getStatusClass('Manutenção')).toBe('status--off'));
  it('retorna status--off para status desconhecido', () => expect(getStatusClass('Status Inexistente')).toBe('status--off'));
});

describe('getLatestSensorData', () => {
  it('retorna o último registro de dados', () => {
    expect(getLatestSensorData(makeMachine())).toEqual({
      timestamp: '2026-03-17T14:00:00-03:00', rpm: 2100, potencia: 550, temperatura: 42,
    });
  });
  it('retorna zeros quando dados está vazio', () => {
    expect(getLatestSensorData(makeMachine({ dados: [] }))).toEqual({
      timestamp: '', rpm: 0, potencia: 0, temperatura: 0,
    });
  });
  it('retorna zeros quando dados é undefined', () => {
    expect(getLatestSensorData(makeMachine({ dados: undefined as any }))).toEqual({
      timestamp: '', rpm: 0, potencia: 0, temperatura: 0,
    });
  });
});

describe('groupByStatus', () => {
  it('agrupa máquinas por categoria', () => {
    const machines = [
      makeMachine({ status: 'Operando' }),
      makeMachine({ status: 'Operando' }),
      makeMachine({ status: 'Temp. Alta' }),
      makeMachine({ status: 'Vibração Alta' }),
      makeMachine({ status: 'Manutenção' }),
    ];
    expect(groupByStatus(machines)).toEqual({ operando: 2, alerta: 1, atencao: 1, offline: 1 });
  });
  it('retorna zeros para lista vazia', () => {
    expect(groupByStatus([])).toEqual({ operando: 0, alerta: 0, atencao: 0, offline: 0 });
  });
});

describe('countAlerts', () => {
  it('conta frequência de cada tipo', () => {
    const result = countAlerts([
      makeMachine({ alertas: ['Temp. Alta', 'Vibração Alta'] }),
      makeMachine({ alertas: ['Temp. Alta'] }),
      makeMachine({ alertas: [] }),
    ]);
    expect(result.find((r) => r.name === 'Temp. Alta')?.value).toBe(2);
    expect(result.find((r) => r.name === 'Vibração Alta')?.value).toBe(1);
  });
  it('retorna array vazio quando não há alertas', () => {
    expect(countAlerts([makeMachine({ alertas: [] })])).toEqual([]);
  });
});

describe('filterMachines', () => {
  const machines = [
    makeMachine({ id: 1, codigo: 'Torno CNC 101',    local: 'Setor A' }),
    makeMachine({ id: 2, codigo: 'Máquina CNC 203',  local: 'Setor B' }),
    makeMachine({ id: 3, codigo: 'Fresadora 305',    local: 'Setor A' }),
  ];
  it('filtra por texto',           () => expect(filterMachines(machines, { search: 'torno' })).toHaveLength(1));
  it('filtra por local',           () => expect(filterMachines(machines, { local:  'Setor A' })).toHaveLength(2));
  it('combina texto e local',      () => expect(filterMachines(machines, { search: 'fresadora', local: 'Setor A' })).toHaveLength(1));
  it('retorna todos sem filtros',  () => expect(filterMachines(machines, {})).toHaveLength(3));
  it('retorna vazio sem resultado',() => expect(filterMachines(machines, { search: 'xyz_inexistente' })).toHaveLength(0));
});

describe('getLocations', () => {
  it('retorna lista única e ordenada', () => {
    const machines = [
      makeMachine({ local: 'Setor B' }),
      makeMachine({ local: 'Setor A' }),
      makeMachine({ local: 'Setor B' }),
    ];
    expect(getLocations(machines)).toEqual(['Setor A', 'Setor B']);
  });
  it('retorna array vazio para lista vazia', () => expect(getLocations([])).toEqual([]));
});

describe('sortMachines', () => {
  it('ordena: alerta → atencao → offline → operando', () => {
    const machines = [
      makeMachine({ id: 1, status: 'Operando' }),
      makeMachine({ id: 2, status: 'Manutenção' }),
      makeMachine({ id: 3, status: 'Vibração Alta' }),
      makeMachine({ id: 4, status: 'Temp. Alta' }),
    ];
    const sorted = sortMachines(machines);
    expect(sorted[0].id).toBe(4);
    expect(sorted[1].id).toBe(3);
    expect(sorted[2].id).toBe(2);
    expect(sorted[3].id).toBe(1);
  });
});

describe('calcEfficiency', () => {
  it('retorna 100% operando sem alertas', () => {
    const r = calcEfficiency(makeMachine({ alertas: [] }));
    expect(r.operando).toBe(100);
    expect(r.alerta).toBe(0);
  });
  it('reduz operando com alertas', () => {
    expect(calcEfficiency(makeMachine({ alertas: ['Temp. Alta', 'Vibração Alta'] })).operando).toBeLessThan(100);
  });
  it('eficiência entre 0 e 100', () => {
    const { eficiencia } = calcEfficiency(makeMachine({ alertas: ['Temp. Alta'] }));
    expect(eficiencia).toBeGreaterThanOrEqual(0);
    expect(eficiencia).toBeLessThanOrEqual(100);
  });
});

describe('formatDateTime', () => {
  it('retorna "—" para null',      () => expect(formatDateTime(null)).toBe('—'));
  it('retorna "—" para undefined', () => expect(formatDateTime(undefined)).toBe('—'));
  it('formata data ISO corretamente', () => {
    const result = formatDateTime('2026-03-17T14:00:00-03:00');
    expect(result).toContain('17');
    expect(result).toContain('2026');
  });
});
