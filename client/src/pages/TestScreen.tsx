import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  useGetAttemptDetailsQuery,
  useSaveAnswerMutation,
  useSubmitAttemptMutation,
  useStartAttemptMutation,
  useAppDispatch,
  useAppSelector,
  startTest,
  setQuestionIndex,
  setLocalAnswer,
  clearTest,
} from '../store';
import styles from './TestScreen.module.scss';

const TestScreen: React.FC = () => {
  const { id: quizId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const [attemptId, setAttemptId] = useState<string>(location.state?.attemptId || '');
  const [startedAt, setStartedAt] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // RTK Mutation triggers
  const [startAttempt] = useStartAttemptMutation();
  const [saveAnswer] = useSaveAnswerMutation();
  const [submitAttempt] = useSubmitAttemptMutation();

  // Load attempt questions and saved answers
  const {
    data: detailsData,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useGetAttemptDetailsQuery(attemptId, {
    skip: !attemptId,
  });

  // Redux test state selectors
  const currentQuestionIndex = useAppSelector((state) => state.test.currentQuestionIndex);
  const localAnswers = useAppSelector((state) => state.test.answers);
  const visited = useAppSelector((state) => state.test.visited);

  const questions = detailsData?.data?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Initialize/Resume attempt
  useEffect(() => {
    const initAttempt = async () => {
      try {
        const res = await startAttempt(quizId as string).unwrap();
        if (res.success && res.data) {
          setAttemptId(res.data.attemptId);
          setStartedAt(res.data.startedAt);
          setDuration(res.data.duration);
        }
      } catch (err) {
        console.error('Failed to initialize attempt:', err);
        alert('Could not start assessment. Redirecting to dashboard.');
        navigate('/participant/dashboard');
      }
    };

    if (quizId) {
      initAttempt();
    }

    return () => {
      dispatch(clearTest());
    };
  }, [quizId, startAttempt, navigate, dispatch]);

  // Load questions into Redux state once fetched
  useEffect(() => {
    if (questions.length > 0) {
      dispatch(startTest());

      // Initialize saved answers from backend
      questions.forEach((q: any, index: number) => {
        if (q.selectedAnswers && q.selectedAnswers.length > 0) {
          dispatch(
            setLocalAnswer({
              questionId: q.id,
              selectedAnswers: q.selectedAnswers,
            })
          );
        }
        // Mark first question as visited
        if (index === 0) {
          dispatch(setQuestionIndex({ index: 0, questionId: q.id }));
        }
      });
    }
  }, [detailsData, dispatch]);

  // Countdown timer logic
  useEffect(() => {
    if (!startedAt || !duration) return;

    const startTime = new Date(startedAt).getTime();
    const durationMs = duration * 60 * 1000;
    const endTime = startTime + durationMs;

    const updateTimer = () => {
      const now = Date.now();
      const difference = endTime - now;
      const remainingSeconds = Math.max(0, Math.floor(difference / 1000));

      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        handleAutoSubmit();
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [startedAt, duration]);

  // Save selected answers to DB immediately when changed
  const handleSelectOption = async (optionLabel: string) => {
    if (!currentQuestion || isSubmitting) return;

    const qId = currentQuestion.id;
    const currentSelections = localAnswers[qId] || [];
    let newSelections: string[] = [];

    if (currentQuestion.type === 'SINGLE_SELECT') {
      newSelections = [optionLabel];
    } else {
      // MULTI_SELECT toggle
      if (currentSelections.includes(optionLabel)) {
        newSelections = currentSelections.filter((l) => l !== optionLabel);
      } else {
        newSelections = [...currentSelections, optionLabel];
      }
    }

    // Update Redux immediately for snappy UI
    dispatch(setLocalAnswer({ questionId: qId, selectedAnswers: newSelections }));

    // Async save to server
    try {
      await saveAnswer({
        attemptId,
        body: {
          questionId: qId,
          selectedAnswers: newSelections,
        },
      }).unwrap();
    } catch (err) {
      console.error('Failed to save answer to server:', err);
    }
  };

  const navigateToQuestion = (index: number) => {
    if (index < 0 || index >= totalQuestions) return;
    const targetQ = questions[index];
    dispatch(setQuestionIndex({ index, questionId: targetQ.id }));
  };

  // Submit test
  const executeSubmission = async (isAuto = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await submitAttempt({
        attemptId,
        body: { isAutoSubmit: isAuto },
      }).unwrap();

      if (res.success) {
        navigate(`/participant/attempts/${attemptId}/submitted`, { replace: true });
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
      alert('Submission failed. Please check your connection and try again.');
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    executeSubmission(true);
  };

  const handleManualSubmit = () => {
    setShowConfirmSubmit(true);
  };

  const formatTimer = (totalSecs: number) => {
    const minutes = Math.floor(totalSecs / 60);
    const seconds = totalSecs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isDetailsLoading || !attemptId) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner}></div>
        <p>Loading Quiz Arena Assessment Environment...</p>
      </div>
    );
  }

  if (detailsError) {
    return (
      <div className={styles.errorScreen}>
        <h2>Error Loading Test Content</h2>
        <p>There was a problem loading the questions. Please try again from the dashboard.</p>
        <button onClick={() => navigate('/participant/dashboard')}>Go to Dashboard</button>
      </div>
    );
  }

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isTimeCritical = timeLeft < 60; // Less than 1 minute

  return (
    <div className={styles.testLayout}>
      {/* Top Banner */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <button
            className={styles.exitBtn}
            onClick={() => {
              if (window.confirm('Are you sure you want to exit? Your timer will continue running!')) {
                navigate('/participant/dashboard');
              }
            }}
          >
            ← Exit Test
          </button>
          <span className={styles.divider}>|</span>
          <h2 className={styles.quizTitle}>{detailsData?.data?.quizTitle}</h2>
        </div>

        <div className={`${styles.timerBox} ${isTimeCritical ? styles.critical : ''}`}>
          <span className={styles.timerIcon}>⏱️</span>
          <span className={styles.timerVal}>{formatTimer(timeLeft)}</span>
          {isTimeCritical && <span className={styles.criticalNotice}>Auto-submitting soon</span>}
        </div>
      </header>

      {/* Main Panel */}
      <div className={styles.mainContainer}>
        {/* Active Question Box */}
        <section className={styles.questionPanel}>
          {currentQuestion ? (
            <div className={styles.questionCard}>
              <div className={styles.questionHeader}>
                <span className={styles.qNumber}>
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className={styles.qType}>
                  {currentQuestion.type === 'SINGLE_SELECT' ? 'Single Choice' : 'Multiple Choices'}
                </span>
              </div>

              <div className={styles.questionBody}>
                <p className={styles.questionText}>{currentQuestion.questionText}</p>

                <div className={styles.optionsList}>
                  {currentQuestion.options?.map((opt: any) => {
                    const isSelected = (localAnswers[currentQuestion.id] || []).includes(
                      opt.label
                    );

                    return (
                      <div
                        key={opt.label}
                        className={`${styles.optionItem} ${isSelected ? styles.selected : ''}`}
                        onClick={() => handleSelectOption(opt.label)}
                      >
                        <div className={styles.optionSelector}>
                          {currentQuestion.type === 'SINGLE_SELECT' ? (
                            <span className={`${styles.radio} ${isSelected ? styles.active : ''}`}></span>
                          ) : (
                            <span className={`${styles.checkbox} ${isSelected ? styles.active : ''}`}></span>
                          )}
                          <span className={styles.optionLabel}>{opt.label}</span>
                        </div>
                        <span className={styles.optionText}>{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.noQuestion}>No questions found in this assessment.</div>
          )}

          {/* Question Navigation Footer */}
          <footer className={styles.questionFooter}>
            <button
              className={styles.navBtn}
              onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </button>

            {isLastQuestion ? (
              <button className={styles.submitBtn} onClick={handleManualSubmit}>
                Submit Assessment
              </button>
            ) : (
              <button
                className={styles.navBtn}
                onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
              >
                Next
              </button>
            )}
          </footer>
        </section>

        {/* Sidebar Question Navigator */}
        <aside className={styles.sidebarNavigator}>
          <h3 className={styles.sidebarTitle}>Assessment Navigator</h3>

          <div className={styles.gridContainer}>
            {questions.map((q: any, idx: number) => {
              const isCurrent = idx === currentQuestionIndex;
              const hasAnswers = (localAnswers[q.id] || []).length > 0;
              const isVisited = visited[q.id];

              let statusClass = styles.unvisited;
              if (hasAnswers) {
                statusClass = styles.answered;
              } else if (isVisited || isCurrent) {
                statusClass = styles.visited;
              }

              return (
                <button
                  key={q.id}
                  className={`${styles.gridItem} ${statusClass} ${isCurrent ? styles.active : ''}`}
                  onClick={() => navigateToQuestion(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={`${styles.indicator} ${styles.answered}`}></span>
              <span>Answered</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.indicator} ${styles.visited}`}></span>
              <span>Visited (Unanswered)</span>
            </div>
            <div className={styles.legendItem}>
              <span className={`${styles.indicator} ${styles.unvisited}`}></span>
              <span>Unvisited</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <h3>Submit Assessment?</h3>
            <p>
              Are you sure you want to submit? You will not be able to change your answers once
              submitted.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => setShowConfirmSubmit(false)}
                disabled={isSubmitting}
              >
                Cancel and Review
              </button>
              <button
                className={styles.modalConfirm}
                onClick={() => executeSubmission(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestScreen;
