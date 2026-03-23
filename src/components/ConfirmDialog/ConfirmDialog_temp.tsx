/**
 * src/components/ConfirmDialog/ConfirmDialog.jsx
 *
 * Pop-up de confirmação antes de salvar alterações de metadados.
 * - Botão "Cancelar" pré-selecionado (autofocus) e em vermelho
 * - Botão "Salvar" em cinza com hover verde
 * - Fecha com ESC ou clique no overlay
 */
import React, { useEffect, useRef } from 'react';
import { Warning, X } from '@phosphor-icons/react';
import styles from './ConfirmDialog_temp.module.css';

export default function ConfirmDialog({ fields, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  /* Foca o botão Cancelar ao abrir (pré-selecionado) */
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  /* Fecha com ESC */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className={styles.dialog}>

        {/* ── Ícone de aviso ── */}
        <div className={styles.iconWrap}>
          <Warning size={28} weight="fill" />
        </div>

        {/* ── Título ── */}
        <h3 className={styles.title} id="confirm-title">
          Confirmar alterações
        </h3>

        {/* ── Mensagem ── */}
        <p className={styles.message}>
          Tem certeza que deseja salvar os dados editados?
          <br />
          <span className={styles.messageSub}>
            Esta ação irá atualizar as informações da máquina.
          </span>
        </p>

        {/* ── Resumo dos campos alterados ── */}
        {fields && fields.length > 0 && (
          <ul className={styles.fieldList}>
            {fields.map(({ label, value }) => (
              <li key={label} className={styles.fieldItem}>
                <span className={styles.fieldLabel}>{label}:</span>
                <span className={styles.fieldValue}>{value || '—'}</span>
              </li>
            ))}
          </ul>
        )}

        {/* ── Ações ── */}
        <div className={styles.actions}>
          {/* Cancelar — pré-selecionado, vermelho */}
          <button
            ref={cancelRef}
            className={styles.cancelBtn}
            onClick={onCancel}
            autoFocus
          >
            <X size={14} weight="bold" />
            Cancelar
          </button>

          {/* Salvar — cinza com hover verde */}
          <button
            className={styles.saveBtn}
            onClick={onConfirm}
          >
            Salvar alterações
          </button>
        </div>

      </div>
    </div>
  );
}