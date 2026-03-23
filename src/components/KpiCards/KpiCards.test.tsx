/**
 * src/components/KpiCards/KpiCards.test.tsx
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import KpiCards from './KpiCards';
import { StatusCounts } from '../../types';

const defaultCounts: StatusCounts = {
  operando: 5,
  alerta:   2,
  atencao:  1,
  offline:  1,
};

const defaultProps = {
  counts:         defaultCounts,
  total:          9,
  previousCounts: null,
  activeFilter:   null as keyof StatusCounts | null,
  onCardClick:    jest.fn(),
};

describe('KpiCards', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renderiza os 4 cards de status', () => {
    render(<KpiCards {...defaultProps} />);
    expect(screen.getByText('Operando')).toBeInTheDocument();
    expect(screen.getByText('Em Alerta')).toBeInTheDocument();
    expect(screen.getByText('Em Atenção')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renderiza os sublabels descritivos', () => {
    render(<KpiCards {...defaultProps} />);
    expect(screen.getByText('Funcionando normalmente')).toBeInTheDocument();
    expect(screen.getByText('Requer atenção imediata')).toBeInTheDocument();
    expect(screen.getByText('Monitoramento necessário')).toBeInTheDocument();
    expect(screen.getByText('Sem comunicação')).toBeInTheDocument();
  });

  it('chama onCardClick com a chave correta ao clicar em Operando', () => {
    const onCardClick = jest.fn();
    render(<KpiCards {...defaultProps} onCardClick={onCardClick} />);
    fireEvent.click(screen.getByLabelText('Filtrar por Operando'));
    expect(onCardClick).toHaveBeenCalledWith('operando');
  });

  it('chama onCardClick ao pressionar Enter', () => {
    const onCardClick = jest.fn();
    render(<KpiCards {...defaultProps} onCardClick={onCardClick} />);
    fireEvent.keyDown(screen.getByLabelText('Filtrar por Operando'), { key: 'Enter' });
    expect(onCardClick).toHaveBeenCalledWith('operando');
  });

  it('exibe indicador "Filtrado" no card ativo', () => {
    render(<KpiCards {...defaultProps} activeFilter="alerta" />);
    expect(screen.getByText('Filtrado')).toBeInTheDocument();
  });

  it('não exibe indicador "Filtrado" quando não há filtro ativo', () => {
    render(<KpiCards {...defaultProps} activeFilter={null} />);
    expect(screen.queryByText('Filtrado')).not.toBeInTheDocument();
  });

  it('marca card ativo com aria-pressed true', () => {
    render(<KpiCards {...defaultProps} activeFilter="operando" />);
    expect(screen.getByLabelText('Filtrar por Operando')).toHaveAttribute('aria-pressed', 'true');
  });

  it('exibe tendência quando previousCounts é fornecido', () => {
    const previousCounts: StatusCounts = { operando: 3, alerta: 2, atencao: 1, offline: 1 };
    render(<KpiCards {...defaultProps} previousCounts={previousCounts} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('exibe "Estável" quando counts não mudaram', () => {
    render(<KpiCards {...defaultProps} previousCounts={{ ...defaultCounts }} />);
    expect(screen.getAllByText('Estável').length).toBeGreaterThan(0);
  });

  it('renderiza corretamente com todos os counts zerados', () => {
    const zeroCounts: StatusCounts = { operando: 0, alerta: 0, atencao: 0, offline: 0 };
    render(<KpiCards {...defaultProps} counts={zeroCounts} total={0} />);
    expect(screen.getByText('Operando')).toBeInTheDocument();
  });
});
