/**
 * src/constants/machineThresholds.ts
 *
 * Faixas operacionais por tipo de máquina.
 * Usadas para classificar métricas como OK, ATENÇÃO ou INADEQUADO
 * na tabela de médias da página de Relatórios.
 *
 * Classificação de cada métrica:
 *  - 'ok'       → dentro da faixa ideal
 *  - 'warn'     → fora do ideal mas ainda tolerável
 *  - 'danger'   → inadequado / requer atenção imediata
 */

export type MetricStatus = 'ok' | 'warn' | 'danger';

export interface MetricThreshold {
  /** Valor mínimo para ser considerado OK */
  okMin: number;
  /** Valor máximo para ser considerado OK */
  okMax: number;
  /** Abaixo deste valor → danger (se definido) */
  dangerBelow?: number;
  /** Acima deste valor → danger (se definido) */
  dangerAbove?: number;
}

export interface MachineThresholds {
  /** Palavra-chave que identifica o tipo — case-insensitive, match parcial */
  keywords: string[];
  rpm:        MetricThreshold;
  potencia:   MetricThreshold;
  temperatura: MetricThreshold;
}

/**
 * Tabela de limites operacionais por tipo de máquina.
 * A ordem importa: a primeira correspondência é usada.
 */
export const MACHINE_THRESHOLDS: MachineThresholds[] = [
  {
    keywords: ['torno'],
    rpm: {
      okMin:       1800,
      okMax:       Infinity,
      dangerBelow: 1600,
    },
    potencia: {
      okMin:      600,
      okMax:      750,
      dangerBelow: 500,
      dangerAbove: 850,
    },
    temperatura: {
      okMin:      38,
      okMax:      50,
      dangerAbove: 60,
      dangerBelow: 30,
    },
  },
  {
    keywords: ['fresadora'],
    rpm: {
      okMin:       4200,
      okMax:       Infinity,
      dangerBelow: 3800,
    },
    potencia: {
      okMin:      900,
      okMax:      1050,
      dangerBelow: 800,
      dangerAbove: 1200,
    },
    temperatura: {
      okMin:      44,
      okMax:      55,
      dangerAbove: 70,
      dangerBelow: 35,
    },
  },
  {
    keywords: ['centro de usinagem', 'usinagem'],
    rpm: {
      okMin:       6000,
      okMax:       Infinity,
      dangerBelow: 5500,
    },
    potencia: {
      okMin:      1300,
      okMax:      1450,
      dangerBelow: 1100,
      dangerAbove: 1500,
    },
    temperatura: {
      okMin:      50,
      okMax:      60,
      dangerAbove: 70,
      dangerBelow: 40,
    },
  },
  {
    keywords: ['retífica', 'retiifica', 'retifica'],
    rpm: {
      okMin:       2900,
      okMax:       Infinity,
      dangerBelow: 2500,
    },
    potencia: {
      okMin:      600,
      okMax:      1000,
      dangerBelow: 500,
      dangerAbove: 1100,
    },
    temperatura: {
      okMin:      40,
      okMax:      60,
      dangerAbove: 70,
      dangerBelow: 35,
    },
  },
  {
    keywords: ['router'],
    rpm: {
      okMin:       14000,
      okMax:       Infinity,
      dangerBelow: 13500,
    },
    potencia: {
      okMin:      700,
      okMax:      820,
      dangerBelow: 600,
      dangerAbove: 900,
    },
    temperatura: {
      okMin:      44,
      okMax:      54,
      dangerAbove: 65,
      dangerBelow: 35,
    },
  },
];

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Retorna os limites operacionais para uma máquina dado seu `codigo`.
 * Retorna `null` se nenhum tipo for reconhecido.
 */
export function getThresholdsForMachine(codigo: string): MachineThresholds | null {
  const lower = codigo.toLowerCase();
  return (
    MACHINE_THRESHOLDS.find((t) =>
      t.keywords.some((kw) => lower.includes(kw))
    ) ?? null
  );
}

/**
 * Classifica um valor numérico dentro de um threshold.
 *
 * Lógica:
 *  1. Se dangerBelow definido e valor < dangerBelow → 'danger'
 *  2. Se dangerAbove definido e valor > dangerAbove → 'danger'
 *  3. Se valor dentro de [okMin, okMax] → 'ok'
 *  4. Caso contrário → 'warn'
 */
export function classifyMetric(
  value: number,
  threshold: MetricThreshold
): MetricStatus {
  if (threshold.dangerBelow !== undefined && value < threshold.dangerBelow) {
    return 'danger';
  }
  if (threshold.dangerAbove !== undefined && value > threshold.dangerAbove) {
    return 'danger';
  }
  if (value >= threshold.okMin && value <= threshold.okMax) {
    return 'ok';
  }
  return 'warn';
}

/**
 * Retorna as classificações de RPM, potência e temperatura
 * para uma máquina, ou `null` se o tipo não for reconhecido.
 */
export function classifyMachineMetrics(
  codigo: string,
  rpm: number,
  potencia: number,
  temperatura: number
): { rpm: MetricStatus; potencia: MetricStatus; temperatura: MetricStatus } | null {
  const thresholds = getThresholdsForMachine(codigo);
  if (!thresholds) return null;

  return {
    rpm:         classifyMetric(rpm,         thresholds.rpm),
    potencia:    classifyMetric(potencia,     thresholds.potencia),
    temperatura: classifyMetric(temperatura,  thresholds.temperatura),
  };
}