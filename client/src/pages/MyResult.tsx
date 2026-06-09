import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetAttemptResultQuery } from '../store';
import styles from './MyResult.module.scss';

const MyResult: React.FC = () => {
  const { id: attemptId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useGetAttemptResultQuery(attemptId as string, {
    skip: !attemptId,
  });

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner}></div>
        <p>Loading your assessment results...</p>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className={styles.errorScreen}>
        <h2>Failed to Load Results</h2>
        <p>There was a problem retrieving your score summary. Please try again from the dashboard.</p>
        <button onClick={() => navigate('/participant/dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  const { quizTitle, result } = data.data;
  const { score, percentage, correct, wrong, skipped, timeTaken } = result;

  const totalQuestions = correct + wrong + skipped;

  // Format time taken (e.g. 125 seconds -> 2m 5s)
  const formatTimeTaken = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // SVG parameters for progress circle
  const radius = 70;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={styles.resultsContainer}>
      {/* Header bar */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/participant/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1 className={styles.title}>{quizTitle}</h1>
      </header>

      {/* Main Stats Split */}
      <div className={styles.mainGrid}>
        {/* Score Hero Card */}
        <section className={styles.heroCard}>
          <div className={styles.progressCircleWrapper}>
            <svg height={radius * 2} width={radius * 2}>
              <circle
                className={styles.circleBg}
                stroke="var(--border-secondary)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                className={styles.circleFg}
                stroke={percentage >= 50 ? 'var(--brand-primary)' : 'var(--status-danger)'}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>
            <div className={styles.scoreText}>
              <span className={styles.percentNumber}>{percentage}%</span>
              <span className={styles.scoreRatio}>
                {score} / {totalQuestions} Correct
              </span>
            </div>
          </div>

          <h2 className={styles.performanceLabel}>
            {percentage >= 80
              ? 'Excellent Performance!'
              : percentage >= 50
              ? 'Passed'
              : 'Needs Improvement'}
          </h2>
          <p className={styles.heroSubtitle}>You scored {score} points out of {totalQuestions} total points.</p>
        </section>

        {/* Detailed Metrics Panel */}
        <section className={styles.metricsPanel}>
          <h3>Performance Metrics</h3>

          <div className={styles.metricsGrid}>
            <div className={`${styles.metricCard} ${styles.correct}`}>
              <div className={styles.metricIcon}>✔️</div>
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Correct</span>
                <span className={styles.metricVal}>{correct} Questions</span>
              </div>
            </div>

            <div className={`${styles.metricCard} ${styles.wrong}`}>
              <div className={styles.metricIcon}>❌</div>
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Incorrect</span>
                <span className={styles.metricVal}>{wrong} Questions</span>
              </div>
            </div>

            <div className={`${styles.metricCard} ${styles.skipped}`}>
              <div className={styles.metricIcon}>🔘</div>
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Skipped</span>
                <span className={styles.metricVal}>{skipped} Questions</span>
              </div>
            </div>

            <div className={`${styles.metricCard} ${styles.time}`}>
              <div className={styles.metricIcon}>⏱️</div>
              <div className={styles.metricInfo}>
                <span className={styles.metricLabel}>Time Spent</span>
                <span className={styles.metricVal}>{formatTimeTaken(timeTaken)}</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className={styles.actionRow}>
            <button
              className={styles.detailsBtn}
              onClick={() => navigate(`/participant/attempts/${attemptId}/details`)}
            >
              Review Question Diagnostics
            </button>
            <button
              className={styles.dashboardBtn}
              onClick={() => navigate('/participant/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MyResult;
