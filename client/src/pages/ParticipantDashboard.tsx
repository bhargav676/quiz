import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetParticipantQuizzesQuery,
  useStartAttemptMutation,
} from '../store';
import PreTestModal from '../molecules/PreTestModal';
import { Loader } from '../atoms';
import styles from './ParticipantDashboard.module.scss';

interface UpcomingCountdownProps {
  scheduleTime: string;
  onTimerEnd?: () => void;
}

const UpcomingCountdown: React.FC<UpcomingCountdownProps> = ({ scheduleTime, onTimerEnd }) => {
  const [timeLeft, setTimeLeft] = useState('');

  React.useEffect(() => {
    const target = new Date(scheduleTime).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft('Available now (Refresh page)');
        if (onTimerEnd) onTimerEnd();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(' '));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [scheduleTime, onTimerEnd]);

  return <span className={styles.countdownValue}>{timeLeft}</span>;
};

const ParticipantDashboard: React.FC = () => {
  const { data, isLoading, refetch } = useGetParticipantQuizzesQuery(undefined, {
    pollingInterval: 15000, // refresh list every 15s to catch new live quizzes
  });
  const [startAttempt, { isLoading: isStarting }] = useStartAttemptMutation();
  const navigate = useNavigate();

  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const quizzes = data?.data || [];

  // Categorize quizzes
  const liveQuizzes = quizzes.filter(
    (q: any) =>
      q.status === 'LIVE' &&
      (!q.attempt || q.attempt.status === 'IN_PROGRESS')
  );

  const upcomingQuizzes = quizzes.filter((q: any) => q.status === 'SCHEDULED');

  const completedQuizzes = quizzes.filter(
    (q: any) =>
      (q.attempt && (q.attempt.status === 'SUBMITTED' || q.attempt.status === 'AUTO_SUBMITTED')) ||
      q.status === 'COMPLETED' ||
      q.status === 'EXPIRED' ||
      q.status === 'CANCELLED'
  );

  const handleOpenModal = (quiz: any) => {
    setSelectedQuiz(quiz);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedQuiz(null);
    setIsModalOpen(false);
  };

  const handleStartQuiz = async () => {
    if (!selectedQuiz) return;
    try {
      const res = await startAttempt(selectedQuiz._id).unwrap();
      if (res.success && res.data) {
        handleCloseModal();
        navigate(`/participant/quiz/${selectedQuiz._id}/attempt`, {
          state: { attemptId: res.data.attemptId },
        });
      }
    } catch (err) {
      console.error('Failed to start quiz attempt:', err);
    }
  };

  const handleResumeQuiz = (quiz: any) => {
    if (quiz.attempt && quiz.attempt.id) {
      navigate(`/participant/quiz/${quiz._id}/attempt`, {
        state: { attemptId: quiz.attempt.id },
      });
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Overview Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statsCard} ${styles.live}`}>
          <div className={styles.icon}>⚡</div>
          <div className={styles.content}>
            <h3>{liveQuizzes.length}</h3>
            <p>Live Quizzes</p>
          </div>
        </div>
        <div className={`${styles.statsCard} ${styles.upcoming}`}>
          <div className={styles.icon}>⏱️</div>
          <div className={styles.content}>
            <h3>{upcomingQuizzes.length}</h3>
            <p>Upcoming Quizzes</p>
          </div>
        </div>
        <div className={`${styles.statsCard} ${styles.completed}`}>
          <div className={styles.icon}>🏆</div>
          <div className={styles.content}>
            <h3>{completedQuizzes.filter((q: any) => q.attempt).length}</h3>
            <p>Quizzes Completed</p>
          </div>
        </div>
      </div>

      {/* Live Quizzes Section */}
      <div className={styles.sectionHeader}>
        <h2>⚡ Live & Active Assessments</h2>
      </div>

      {isLoading ? (
        <Loader message="Loading your assignments..." />
      ) : liveQuizzes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No live quizzes assigned to you right now. They will show up here when they start.</p>
        </div>
      ) : (
        <div className={styles.quizGrid}>
          {liveQuizzes.map((quiz: any) => (
            <div key={quiz._id} className={`${styles.quizCard} ${styles.liveQuiz}`}>
              <div className={styles.cardHeader}>
                <span className={styles.badge}>LIVE</span>
                <h3>{quiz.title}</h3>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.desc}>
                  {quiz.description || 'No description provided.'}
                </p>
                <div className={styles.metaRow}>
                  <span>⏱️ {quiz.duration} mins</span>
                  <span>❓ {quiz.questionsCount} MCQs</span>
                </div>
              </div>
              <div className={styles.cardFooter}>
                {quiz.attempt && quiz.attempt.status === 'IN_PROGRESS' ? (
                  <button
                    className={styles.resumeBtn}
                    onClick={() => handleResumeQuiz(quiz)}
                  >
                    Resume Quiz
                  </button>
                ) : (
                  <button
                    className={styles.startBtn}
                    onClick={() => handleOpenModal(quiz)}
                  >
                    Start Quiz
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Quizzes Section */}
      <div className={styles.sectionHeader}>
        <h2>⏱️ Upcoming Assessments</h2>
      </div>

      {upcomingQuizzes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No upcoming assessments scheduled.</p>
        </div>
      ) : (
        <div className={styles.quizGrid}>
          {upcomingQuizzes.map((quiz: any) => (
            <div key={quiz._id} className={`${styles.quizCard} ${styles.upcomingQuiz}`}>
              <div className={styles.cardHeader}>
                <span className={styles.upcomingBadge}>UPCOMING</span>
                <h3>{quiz.title}</h3>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.desc}>
                  {quiz.description || 'No description provided.'}
                </p>
                <div className={styles.metaRow}>
                  <span>⏱️ {quiz.duration} mins</span>
                  <span>📅 Starts: {formatDate(quiz.scheduleTime)}</span>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.countdownContainer}>
                  <span className={styles.countdownLabel}>Starts in:</span>
                  <UpcomingCountdown
                    scheduleTime={quiz.scheduleTime}
                    onTimerEnd={() => refetch()}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed / Past Quizzes Section */}
      <div className={styles.sectionHeader}>
        <h2>🏆 Completed & Past Assessments</h2>
      </div>

      {completedQuizzes.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No past or completed assessments found.</p>
        </div>
      ) : (
        <div className={styles.resultsTableContainer}>
          <table className={styles.resultsTable}>
            <thead>
              <tr>
                <th>Quiz Title</th>
                <th>Duration</th>
                <th>Attempt Status</th>
                <th>Score Obtained</th>
                <th>Completion Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {completedQuizzes.map((quiz: any) => {
                const hasAttempt = !!quiz.attempt;
                const isSubmitted =
                  quiz.attempt?.status === 'SUBMITTED' ||
                  quiz.attempt?.status === 'AUTO_SUBMITTED';

                return (
                  <tr key={quiz._id}>
                    <td className={styles.quizTitleCol}>
                      <strong>{quiz.title}</strong>
                    </td>
                    <td>{quiz.duration} mins</td>
                    <td>
                      {hasAttempt ? (
                        <span
                          className={`${styles.statusLabel} ${
                            quiz.attempt.status === 'AUTO_SUBMITTED'
                              ? styles.autoSubmitted
                              : styles.submitted
                          }`}
                        >
                          {quiz.attempt.status === 'AUTO_SUBMITTED'
                            ? 'Auto Submitted'
                            : 'Submitted'}
                        </span>
                      ) : (
                        <span className={`${styles.statusLabel} ${styles.missed}`}>
                          Missed / Expired
                        </span>
                      )}
                    </td>
                    <td>
                      {isSubmitted
                        ? `${quiz.attempt.score} / ${quiz.questionsCount}`
                        : '—'}
                    </td>
                    <td>
                      {isSubmitted ? formatDate(quiz.attempt.submittedAt) : '—'}
                    </td>
                    <td>
                      {isSubmitted && quiz.attempt.id ? (
                        <button
                          className={styles.viewResultBtn}
                          onClick={() =>
                            navigate(`/participant/attempts/${quiz.attempt.id}/result`)
                          }
                        >
                          View Results
                        </button>
                      ) : (
                        <span className={styles.noAction}>No result details</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PreTestModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleStartQuiz}
        isLoading={isStarting}
        quiz={selectedQuiz}
      />
    </div>
  );
};

export default ParticipantDashboard;
