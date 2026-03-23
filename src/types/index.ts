/**
 * src/types/index.ts
 * Definições de tipos centrais da aplicação ECO+ Machines.
 */

export interface SensorReading {
  timestamp: string;
  rpm: number;
  potencia: number;
  temperatura: number;
}

export interface Machine {
  id: number;
  codigo: string;
  nome?: string;
  descricao?: string;
  local: string;
  status: string;
  alertas: string[];
  ultimaAtualizacao: string;
  dados: SensorReading[];
}

export type StatusCategory = 'operando' | 'alerta' | 'atencao' | 'offline';

export interface StatusCounts {
  operando: number;
  alerta: number;
  atencao: number;
  offline: number;
}

export interface AlertChartEntry {
  name: string;
  value: number;
}

export interface EfficiencyData {
  operando: number;
  atencao: number;
  alerta: number;
  eficiencia: number;
}

export interface UpdateMachinePayload {
  nome?: string;
  descricao?: string;
  local?: string;
}

export interface ConfirmField {
  label: string;
  value: string;
}

export type ThemeValue = 'light' | 'dark';

export interface ThemeContextValue {
  theme: ThemeValue;
  toggleTheme: () => void;
  setTheme: (t: ThemeValue) => void;
}
