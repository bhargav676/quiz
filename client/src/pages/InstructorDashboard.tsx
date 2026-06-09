import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  useGetInstructorQuizzesQuery,
  useCreateInstructorQuizMutation,
  useUpdateInstructorQuizMutation,
  usePublishQuizMutation,
  useCancelInstructorQuizMutation,
} from '../store';
import { QuizStatus } from '../types';
import { CancelModal } from '../molecules/CancelModal';
import { Loader } from '../atoms';
import styles from './InstructorDashboard.module.scss';

const InstructorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: quizzesRes, isLoading, error, refetch } = useGetInstructorQuizzesQuery(undefined);

  // Mutations
  const [createQuiz, { isLoading: isCreating }] = useCreateInstructorQuizMutation();
  const [updateQuiz] = useUpdateInstructorQuizMutation();
  const [publishQuiz, { isLoading: isPublishing }] = usePublishQuizMutation();
  const [cancelQuiz, { isLoading: isCancelling }] = useCancelInstructorQuizMutation();

  // Inline Editing State
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState<string>('');

  // Cancel Modal State
  const [cancelQuizId, setCancelQuizId] = useState<string | null>(null);

  const handleCreateQuiz = async () => {
    try {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      // Local ISO string slice for clean startup
      const tzoffset = tomorrow.getTimezoneOffset() * 60000;
      const formattedTomorrow = new Date(tomorrow.getTime() - tzoffset).toISOString().slice(0, 16);

      const res = await createQuiz({
        title: 'New Quiz Draft',
        duration: 30,
        scheduleTime: formattedTomorrow,
        questionType: 'SINGLE_SELECT',
      }).unwrap();

      if (res.success && res.data) {
        navigate(`/instructor/quizzes/${res.data.id}/edit`);
      }
    } catch (err) {
      alert('Failed to create quiz draft.');
    }
  };

  const handleStartEditSchedule = (quizId: string, currentTime: string) => {
    setEditingQuizId(quizId);
    // Convert to datetime-local friendly format
    const date = new Date(currentTime);
    const tzoffset = date.getTimezoneOffset() * 60000;
    const formattedDate = new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
    setEditingTime(formattedDate);
  };

  const handleSaveSchedule = async (quizId: string) => {
    if (!editingTime) return;
    try {
      await updateQuiz({
        id: quizId,
        body: { scheduleTime: new Date(editingTime).toISOString() },
      }).unwrap();
      setEditingQuizId(null);
    } catch {
      alert('Failed to update quiz schedule.');
    }
  };

  const handlePublish = async (quizId: string) => {
    try {
      await publishQuiz(quizId).unwrap();
    } catch (err: any) {
      alert(err?.data?.message || err?.message || 'Failed to publish quiz.');
    }
  };

  const handleOpenCancelModal = (quizId: string) => {
    setCancelQuizId(quizId);
  };

  const handleConfirmCancel = async () => {
    if (!cancelQuizId) return;
    try {
      await cancelQuiz(cancelQuizId).unwrap();
      setCancelQuizId(null);
    } catch (err: any) {
      alert(err?.data?.message || err?.message || 'Failed to cancel quiz.');
      setCancelQuizId(null);
    }
  };

  const formatDate = (dateStr: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateStr));
  };

  if (isLoading) {
    return <Loader message="Loading dashboard..." />;
  }

  if (error || !quizzesRes?.success) {
    return (
      <div className={styles.card} style={{ borderColor: 'var(--status-danger)', background: 'var(--status-danger-bg)' }}>
        <p style={{ color: 'var(--status-danger)', fontWeight: 'bold' }}>Error loading quizzes. Please refresh the page.</p>
      </div>
    );
  }

  const quizzes = quizzesRes.data || [];

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.titleRow}>
        <div>
          <h1>Instructor Dashboard</h1>
          <p>Create, update, and manage your assessments and results.</p>
        </div>
        <button className={styles.actionBtn} onClick={handleCreateQuiz} disabled={isCreating} style={{ background: 'var(--brand-primary)', color: 'var(--text-inverse)', borderColor: 'var(--brand-primary)' }}>
          {isCreating ? 'Creating...' : '➕ Create Assessment Draft'}
        </button>
      </div>

      <div className={styles.card}>
        {quizzes.length === 0 ? (
          <div className={styles.emptyState}>
            No quizzes created yet. Click 'Create Assessment Draft' to get started!
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Schedule Time</th>
                  <th>Duration</th>
                  <th>Readiness Status</th>
                  <th>Status</th>
                  <th>Submissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz: any) => {
                  const isDraft = quiz.status === QuizStatus.DRAFT;
                  const isScheduled = quiz.status === QuizStatus.SCHEDULED;
                  const isLive = quiz.status === QuizStatus.LIVE;
                  const isCompleted = quiz.status === QuizStatus.COMPLETED;
                  const isCancelled = quiz.status === QuizStatus.CANCELLED;

                  return (
                    <tr key={quiz.id}>
                      <td className={styles.titleCell}>{quiz.title}</td>
                      <td>
                        {editingQuizId === quiz.id ? (
                          <div className={styles.inlineEditSchedule}>
                            <input
                              type="datetime-local"
                              value={editingTime}
                              onChange={(e) => setEditingTime(e.target.value)}
                            />
                            <button
                              className={`${styles.iconBtn} ${styles.save}`}
                              onClick={() => handleSaveSchedule(quiz.id)}
                              title="Save Schedule"
                            >
                              ✔
                            </button>
                            <button
                              className={styles.iconBtn}
                              onClick={() => setEditingQuizId(null)}
                              title="Cancel"
                            >
                              ✖
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{formatDate(quiz.scheduleTime)}</span>
                            {(isDraft || isScheduled) && (
                              <button
                                className={styles.iconBtn}
                                onClick={() => handleStartEditSchedule(quiz.id, quiz.scheduleTime)}
                                title="Edit Schedule inline"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td>{quiz.duration} mins</td>
                      <td>
                        <div className={styles.readinessContainer}>
                          <span
                            className={`${styles.readinessBadge} ${
                              quiz.readiness.isReady ? styles.ready : styles.draft
                            }`}
                          >
                            {quiz.readiness.isReady ? 'Ready to Publish' : 'Draft Incomplete'}
                          </span>
                          <div className={styles.readinessPills}>
                            <span
                              className={`${styles.indicatorPill} ${
                                quiz.readiness.hasQuestions ? styles.success : styles.danger
                              }`}
                            >
                              {quiz.readiness.hasQuestions ? 'Q ✓' : 'Q ✖'}
                            </span>
                            <span
                              className={`${styles.indicatorPill} ${
                                quiz.readiness.hasParticipants ? styles.success : styles.danger
                              }`}
                            >
                              {quiz.readiness.hasParticipants ? 'P ✓' : 'P ✖'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={styles.statusBadge}
                          style={{
                            background:
                              isLive
                                ? 'var(--status-success-bg)'
                                : isScheduled
                                ? 'var(--status-info-bg)'
                                : isCompleted
                                ? 'var(--bg-tertiary)'
                                : isCancelled
                                ? 'var(--status-danger-bg)'
                                : 'var(--status-warning-bg)',
                            color:
                              isLive
                                ? 'var(--status-success)'
                                : isScheduled
                                ? 'var(--status-info)'
                                : isCompleted
                                ? 'var(--text-secondary)'
                                : isCancelled
                                ? 'var(--status-danger)'
                                : 'var(--status-warning)',
                          }}
                        >
                          {quiz.status}
                        </span>
                      </td>
                      <td>{quiz.attemptsCount || 0} attempts</td>
                      <td className={styles.actionsCell}>
                        {(isDraft || isScheduled) && (
                          <Link to={`/instructor/quizzes/${quiz.id}/edit`} className={styles.actionBtn}>
                            ✏️ Edit
                          </Link>
                        )}

                        {isDraft && quiz.readiness.isReady && (
                          <button
                            className={`${styles.actionBtn} ${styles.success}`}
                            onClick={() => handlePublish(quiz.id)}
                            disabled={isPublishing}
                          >
                            🚀 Publish
                          </button>
                        )}

                        {(isDraft || isScheduled || isLive) && (
                          <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={() => handleOpenCancelModal(quiz.id)}
                            disabled={isCancelling}
                          >
                            🚫 Cancel
                          </button>
                        )}

                        {isCompleted && (
                          <Link
                            to={`/instructor/quizzes/${quiz.id}/analytics`}
                            className={`${styles.actionBtn} ${styles.primary}`}
                          >
                            📊 Analytics
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <CancelModal
        isOpen={!!cancelQuizId}
        onClose={() => setCancelQuizId(null)}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelling}
      />
    </div>
  );
};

export default InstructorDashboard;
