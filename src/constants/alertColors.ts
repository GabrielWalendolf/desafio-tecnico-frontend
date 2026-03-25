/**
 * src/constants/alertColors.ts
 * Fonte única de verdade para cores e ícones de cada alerta.
 * Usada no gráfico donut, nas badges dos cards e no AlertPanel.
 */

export interface AlertColorConfig {
  /** Cor principal (texto + ícone) */
  color: string;
  /** Fundo escuro semitransparente */
  bg: string;
  /** Borda superior sutil */
  borderTop: string;
}

export const ALERT_COLOR_MAP: Record<string, AlertColorConfig> = {
  'Desgaste de Ferramenta': {
    color:     '#b08800',
    bg:        'rgba(176,136,0,0.12)',
    borderTop: 'rgba(176,136,0,0.22)',
  },
  'Temp. Alta': {
    color:     '#f85149',
    bg:        'rgba(248,81,73,0.12)',
    borderTop: 'rgba(248,81,73,0.22)',
  },
  'Pico de Potência': {
    color:     '#f97316',
    bg:        'rgba(249,115,22,0.12)',
    borderTop: 'rgba(249,115,22,0.22)',
  },
  'RPM Baixo': {
    color:     '#a371f7',
    bg:        'rgba(163,113,247,0.12)',
    borderTop: 'rgba(163,113,247,0.22)',
  },
  'Vibração Alta': {
    color:     '#e3b341',
    bg:        'rgba(227,179,65,0.12)',
    borderTop: 'rgba(227,179,65,0.22)',
  },
  'Inspeção Recomendada': {
    color:     '#0d9488',
    bg:        'rgba(13,148,136,0.12)',
    borderTop: 'rgba(13,148,136,0.22)',
  },
  'Parada Não Programada': {
    color:     '#dc2626',
    bg:        'rgba(220,38,38,0.12)',
    borderTop: 'rgba(220,38,38,0.22)',
  },
  'Sem Telemetria': {
    color:     '#7c6f8e',
    bg:        'rgba(124,111,142,0.12)',
    borderTop: 'rgba(124,111,142,0.22)',
  },
  'Manutenção Preventiva': {
    color:     '#58a6ff',
    bg:        'rgba(88,166,255,0.12)',
    borderTop: 'rgba(88,166,255,0.22)',
  },
};

/** Fallback para alertas não mapeados */
export const ALERT_COLOR_FALLBACK: AlertColorConfig = {
  color:     '#f85149',
  bg:        'rgba(248,81,73,0.12)',
  borderTop: 'rgba(248,81,73,0.22)',
};

export function getAlertColor(alerta: string): AlertColorConfig {
  return ALERT_COLOR_MAP[alerta] ?? ALERT_COLOR_FALLBACK;
}

/** Array de cores na ordem do mapa — usado pelo gráfico donut */
export const ALERT_DONUT_COLORS: string[] = Object.values(ALERT_COLOR_MAP).map(
  (c) => c.color
);