/**
 * src/constants/statusMap.ts
 * Fonte única da verdade para mapeamento de status da API → categoria KPI.
 */
import { StatusCategory } from '../types';

export const STATUS_CATEGORY_MAP: Record<string, StatusCategory> = {
  // ── Operando ────────────────────────────────────────────────
  'Operando':           'operando',

  // ── Em Alerta ───────────────────────────────────────────────
  'Temp. Alta':         'alerta',
  'Ferramenta Gasta':   'alerta',
  'Alerta de Potência': 'alerta',
  'Parada':             'alerta',

  // ── Em Atenção ──────────────────────────────────────────────
  'Baixa Produção':     'atencao',
  'Vibração Alta':      'atencao',

  // ── Offline ─────────────────────────────────────────────────
  'Manutenção':         'offline',
};

export const STATUS_SORT_ORDER: Record<StatusCategory, number> = {
  alerta:   0,
  atencao:  1,
  offline:  2,
  operando: 3,
};

export function getStatusCategory(status: string): StatusCategory {
  const category = STATUS_CATEGORY_MAP[status];

  if (!category) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[statusMap] Status desconhecido: "${status}". ` +
        'Adicione-o em src/constants/statusMap.ts.'
      );
    }
    return 'offline';
  }

  return category;
}

export const CATEGORY_CSS_CLASS: Record<StatusCategory, string> = {
  operando: 'status--ok',
  alerta:   'status--danger',
  atencao:  'status--warn',
  offline:  'status--off',
};
