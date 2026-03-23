/**
 * src/components/FilterBar/FilterBar.test.jsx
 * Testes do componente FilterBar.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterBar from './FilterBar';

const defaultProps = {
  search: '',
  onSearch: jest.fn(),
  local: '',
  onLocal: jest.fn(),
  locations: ['Setor A', 'Setor B', 'Setor C'],
  total: 10,
  filtered: 10,
};

describe('FilterBar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renderiza o campo de busca', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Buscar máquina…')).toBeInTheDocument();
  });

  it('renderiza o select de locais', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByLabelText('Filtrar por local')).toBeInTheDocument();
  });

  it('exibe todas as opções de local', () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText('Setor A')).toBeInTheDocument();
    expect(screen.getByText('Setor B')).toBeInTheDocument();
    expect(screen.getByText('Setor C')).toBeInTheDocument();
  });

  it('exibe contador quando total e filtered são iguais', () => {
    render(<FilterBar {...defaultProps} total={10} filtered={10} />);
    expect(screen.getByText('10 máquinas')).toBeInTheDocument();
  });

  it('exibe contador parcial quando filtered é diferente de total', () => {
    render(<FilterBar {...defaultProps} total={10} filtered={4} />);
    expect(screen.getByText('4 de 10 máquinas')).toBeInTheDocument();
  });

  it('chama onSearch ao digitar no campo de busca', () => {
    const onSearch = jest.fn();
    render(<FilterBar {...defaultProps} onSearch={onSearch} />);
    fireEvent.change(screen.getByPlaceholderText('Buscar máquina…'), {
      target: { value: 'torno' },
    });
    expect(onSearch).toHaveBeenCalledWith('torno');
  });

  it('chama onLocal ao selecionar um local', () => {
    const onLocal = jest.fn();
    render(<FilterBar {...defaultProps} onLocal={onLocal} />);
    fireEvent.change(screen.getByLabelText('Filtrar por local'), {
      target: { value: 'Setor A' },
    });
    expect(onLocal).toHaveBeenCalledWith('Setor A');
  });

  it('exibe botão de limpar quando há texto na busca', () => {
    render(<FilterBar {...defaultProps} search="torno" />);
    expect(screen.getByLabelText('Limpar busca')).toBeInTheDocument();
  });

  it('chama onSearch com string vazia ao clicar em limpar', () => {
    const onSearch = jest.fn();
    render(<FilterBar {...defaultProps} search="torno" onSearch={onSearch} />);
    fireEvent.click(screen.getByLabelText('Limpar busca'));
    expect(onSearch).toHaveBeenCalledWith('');
  });
});