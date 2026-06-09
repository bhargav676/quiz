import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetAttemptDetailsQuery } from '../store';
import styles from './DetailedResult.module.scss';

const DetailedResult: React.FC = () => {
  const { id: attemptId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useGetAttemptDetailsQuery(attemptId as string, {
    skip: !attemptId,
  });

  if (isLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner}></div>
        <p>Loading question diagnostics...</p>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className={styles.errorScreen}>
        <h2>Failed to Load Diagnostic Details</h2>
        <p>There was a problem retrieving your detailed question review. Please try again.</p>
        <button onClick={() => navigate(`/participant/attempts/${attemptId}/result`)}>
          Back to Summary
        </button>
      </div>
    );
  }

  const { quizTitle, questions = [] } = data.data;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(`/participant/attempts/${attemptId}/result`)}
        >
          ← Back to Score Summary
        </button>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{quizTitle}</h1>
          <span className={styles.badge}>Detailed Review</span>
        </div>
      </header>

      {/* Questions list */}
      <div className={styles.questionsList}>
        {questions.map((q: any, idx: number) => {
          let statusLabel = 'Skipped';
          let statusClass = styles.skipped;
          
          if (!q.isSkipped) {
            statusLabel = q.isCorrect ? 'Correct' : 'Incorrect';
            statusClass = q.isCorrect ? styles.correct : styles.incorrect;
          }

          return (
            <div key={q.id} className={`${styles.questionCard} ${statusClass}`}>
              {/* Question Card Top Bar */}
              <div className={styles.cardHeader}>
                <span className={styles.qNumber}>Question {idx + 1}</span>
                <span className={`${styles.statusBadge} ${statusClass}`}>
                  {statusLabel === 'Correct' && '✔️ '}
                  {statusLabel === 'Incorrect' && '❌ '}
                  {statusLabel === 'Skipped' && '🔘 '}
                  {statusLabel}
                </span>
              </div>

              {/* Question Text */}
              <div className={styles.cardBody}>
                <p className={styles.questionText}>{q.questionText}</p>

                {/* Options Review */}
                <div className={styles.optionsList}>
                  {q.options?.map((opt: any) => {
                    const isSelected = q.selectedAnswers.includes(opt.label);
                    const isCorrectOption = q.correctAnswers.includes(opt.label);

                    let optionClass = '';
                    let indicatorText = null;

                    if (isCorrectOption) {
                      optionClass = styles.correctOption;
                      indicatorText = isSelected ? '✓ Your Selection (Correct)' : '✓ Correct Answer';
                    } else if (isSelected && !isCorrectOption) {
                      optionClass = styles.wrongOption;
                      indicatorText = '✗ Your Selection (Incorrect)';
                    }

                    return (
                      <div key={opt.label} className={`${styles.optionItem} ${optionClass}`}>
                        <div className={styles.optionContent}>
                          <span className={styles.optionLabel}>{opt.label}</span>
                          <span className={styles.optionText}>{opt.text}</span>
                        </div>
                        {indicatorText && (
                          <span className={styles.optionIndicator}>{indicatorText}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DetailedResult;
