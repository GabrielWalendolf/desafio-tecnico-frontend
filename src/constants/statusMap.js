/**
 * src/constants/statusMap.js
 *
 * Fonte única da verdade para mapeamento de status da API → categoria KPI.
 *
 * Para adicionar um novo status basta incluir uma entrada aqui.
 * As chaves devem corresponder EXATAMENTE ao valor retornado pela API
 * (incluindo acentuação e capitalização).
 *
 * Categorias disponíveis: 'operando' | 'alerta' | 'atencao' | 'offline'
 */

export const STATUS_CATEGORY_MAP = {
  // ── Operando ────────────────────────────────────────────────
  'Operando':           'operando',

  // ── Em Alerta ───────────────────────────────────────────────
  'Temp. Alta':         'alerta',
  'Ferramenta Gasta':       'alerta',
  'Alerta de Potência': 'alerta',
  'Parada':             'alerta',

  // ── Em Atenção ──────────────────────────────────────────────
  'Baixa Produção':     'atencao',
  'Vibração Alta':      'atencao',

  // ── Offline ─────────────────────────────────────────────────
  'Manutenção':         'offline',
};

/**
 * Retorna a categoria KPI de um status.
 * Se o status não estiver mapeado, cai em 'offline' por segurança
 * e loga um aviso em desenvolvimento para facilitar a detecção de
 * novos valores vindos da API.
 *
 * @param {string} status - Valor de status retornado pela API
 * @returns {'operando'|'alerta'|'atencao'|'offline'}
 */
export function getStatusCategory(status) {
  const category = STATUS_CATEGORY_MAP[status];

  if (!category) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[statusMap] Status desconhecido: "${status}". ` +
        'Adicione-o em src/constants/statusMap.js.'
      );
    }
    return 'offline';
  }

  return category;
}

/**
 * Mapeia categoria KPI → classe CSS usada nos cards e badges.
 */
export const CATEGORY_CSS_CLASS = {
  operando: 'status--ok',
  alerta:   'status--danger',
  atencao:  'status--warn',
  offline:  'status--off',
};