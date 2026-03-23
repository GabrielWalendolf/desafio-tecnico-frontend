/**
 * src/components/ConfirmDialog/ConfirmDialog.tsx
 * Pop-up de confirmação antes de salvar alterações de metadados.
 */
import React, { useEffect, useRef } from 'react';
import { Warning, X } from '@phosphor-icons/react';
import { ConfirmField } from '../../types';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  fields: ConfirmField[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ fields, onConfirm, onCancel }: ConfirmDialogProps): React.ReactElement {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
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
        <div className={styles.iconWrap}>
          <Warning size={28} weight="fill" />
        </div>

        <h3 className={styles.title} id="confirm-title">
          Confirmar alterações
        </h3>

        <p className={styles.message}>
          Tem certeza que deseja salvar os dados editados?
          <br />
          <span className={styles.messageSub}>
            Esta ação irá atualizar as informações da máquina.
          </span>
        </p>

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

        <div className={styles.actions}>
          <button
            ref={cancelRef}
            className={styles.cancelBtn}
            onClick={onCancel}
            autoFocus
          >
            <X size={14} weight="bold" />
            Cancelar
          </button>
          <button className={styles.saveBtn} onClick={onConfirm}>
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}
