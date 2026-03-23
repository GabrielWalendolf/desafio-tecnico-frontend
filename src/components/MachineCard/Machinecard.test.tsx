/**
 * src/components/MachineCard/MachineCard.test.tsx
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MachineCard from './MachineCard';
import { Machine } from '../../types';

const makeMachine = (overrides: Partial<Machine> = {}): Machine => ({
  id: 1,
  codigo: 'Torno CNC 101',
  local: 'Setor A',
  status: 'Operando',
  alertas: [],
  ultimaAtualizacao: '2026-03-17T14:00:00-03:00',
  dados: [
    { timestamp: '2026-03-17T14:00:00-03:00', rpm: 2100, potencia: 550, temperatura: 42 },
  ],
  ...overrides,
});

describe('MachineCard', () => {
  it('exibe o nome da máquina', () => {
    render(<MachineCard machine={makeMachine()} onClick={() => {}} />);
    expect(screen.getByText('Torno CNC 101')).toBeInTheDocument();
  });

  it('exibe o local da máquina', () => {
    render(<MachineCard machine={makeMachine()} onClick={() => {}} />);
    expect(screen.getByText('Setor A')).toBeInTheDocument();
  });

  it('exibe o status da máquina', () => {
    render(<MachineCard machine={makeMachine()} onClick={() => {}} />);
    expect(screen.getByText('Operando')).toBeInTheDocument();
  });

  it('exibe os valores de sensores', () => {
    render(<MachineCard machine={makeMachine()} onClick={() => {}} />);
    expect(screen.getByText('2.100')).toBeInTheDocument();
    expect(screen.getByText('550')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('exibe "Nenhum" quando não há alertas', () => {
    render(<MachineCard machine={makeMachine({ alertas: [] })} onClick={() => {}} />);
    expect(screen.getByText('Nenhum')).toBeInTheDocument();
  });

  it('exibe tags de alertas quando existem', () => {
    const machine = makeMachine({ alertas: ['Temp. Alta', 'Vibração Alta'] });
    render(<MachineCard machine={machine} onClick={() => {}} />);
    expect(screen.getByText('Temp. Alta')).toBeInTheDocument();
    expect(screen.getByText('Vibração Alta')).toBeInTheDocument();
  });

  it('chama onClick ao ser clicado', () => {
    const handleClick = jest.fn();
    const machine = makeMachine();
    render(<MachineCard machine={machine} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith(machine);
  });

  it('chama onClick ao pressionar Enter', () => {
    const handleClick = jest.fn();
    const machine = makeMachine();
    render(<MachineCard machine={machine} onClick={handleClick} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledWith(machine);
  });
});
