import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './PostSubmit.module.scss';

const PostSubmit: React.FC = () => {
  const { id: attemptId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconCircle}>✔</div>

        <h1 className={styles.title}>Assessment Submitted!</h1>
        <p className={styles.subtitle}>
          Thank you. Your assessment has been securely recorded and submitted to the evaluation server.
        </p>

        <div className={styles.infoBox}>
          <h3>💡 What's next?</h3>
          <ul>
            <li>
              <strong>Check Dashboard:</strong> You can view your grades and correct/incorrect answer details for completed quizzes.
            </li>
            <li>
              <strong>Questions or Concerns?</strong> Please contact your instructor at{' '}
              <a href="mailto:instructor@quizarena.com">instructor@quizarena.com</a>.
            </li>
          </ul>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.viewResultBtn}
            onClick={() => {
              if (attemptId) {
                navigate(`/participant/attempts/${attemptId}/result`);
              } else {
                navigate('/participant/dashboard');
              }
            }}
          >
            View Score Summary
          </button>
          <button
            className={styles.dashboardBtn}
            onClick={() => navigate('/participant/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostSubmit;
