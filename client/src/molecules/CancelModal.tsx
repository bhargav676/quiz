import React, { useState } from 'react';
import styles from './CancelModal.module.scss';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const CancelModal: React.FC<CancelModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.title}>
          <span>⚠️</span>
          <span>Cancel Quiz Confirmation</span>
        </div>

        <div className={styles.body}>
          Are you sure you want to cancel this quiz? This will set the quiz status to{' '}
          <strong>CANCELLED</strong>. Participants will no longer be able to attempt this quiz.
        </div>

        <label className={styles.checkboxContainer}>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={isLoading}
          />
          <span>I understand that this action is irreversible and will cancel the quiz for all participants.</span>
        </label>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isLoading}>
            Keep Quiz Active
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!confirmed || isLoading}
          >
            {isLoading ? 'Cancelling...' : 'Yes, Cancel Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};
