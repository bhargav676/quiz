import React from 'react';
import styles from './PreTestModal.module.scss';

interface PreTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  quiz: {
    title: string;
    duration: number;
    questionsCount: number;
  } | null;
}

const PreTestModal: React.FC<PreTestModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  quiz,
}) => {
  if (!isOpen || !quiz) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2>Pre-Test Instructions</h2>
          <button className={styles.closeBtn} onClick={onClose} disabled={isLoading}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          <h3 className={styles.quizTitle}>{quiz.title}</h3>
          
          <div className={styles.metaInfo}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Duration:</span>
              <span className={styles.metaValue}>{quiz.duration} Minutes</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Questions:</span>
              <span className={styles.metaValue}>{quiz.questionsCount} MCQs</span>
            </div>
          </div>

          <div className={styles.section}>
            <h4>⚠️ Rules & Guidelines</h4>
            <ul>
              <li>Once you start, the timer will run continuously and cannot be paused.</li>
              <li>Ensure you have a stable network connection before starting.</li>
              <li>Do not refresh the page or navigate away, as this may result in loss of progress.</li>
              <li>For multi-select questions, you must select all correct options to get marks.</li>
            </ul>
          </div>

          <div className={styles.alertBox}>
            <div className={styles.alertIcon}>📡</div>
            <div className={styles.alertContent}>
              <h5>Network Warning</h5>
              <p>
                Closing the browser or losing internet connectivity does NOT stop the server timer.
                Ensure you stay connected.
              </p>
            </div>
          </div>

          <div className={styles.alertBox}>
            <div className={styles.alertIcon}>⏱️</div>
            <div className={styles.alertContent}>
              <h5>Auto-Submit Notice</h5>
              <p>
                When the countdown timer reaches 0, the system will automatically submit your saved
                answers.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className={styles.startBtn} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Preparing Assessment...' : 'Start Assessment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreTestModal;
