import React from 'react';
import { Link } from 'react-router-dom';
import { useGetDashboardStatsQuery, useGetAdminQuizzesQuery } from '../store';
import styles from './AdminDashboard.module.scss';
import { QuizStatus } from '../types';
import { Loader } from '../atoms';

const AdminDashboard: React.FC = () => {
  const { data: statsData, isLoading: statsLoading, error: statsError } = useGetDashboardStatsQuery(undefined);
  const { data: quizzesData, isLoading: quizzesLoading, error: quizzesError } = useGetAdminQuizzesQuery(undefined);

  const isLoading = statsLoading || quizzesLoading;
  const hasError = statsError || quizzesError;

  if (isLoading) {
    return <Loader message="Loading dashboard statistics..." />;
  }

  if (hasError) {
    return (
      <div className={styles.card} style={{ borderColor: 'var(--status-danger)', background: 'var(--status-danger-bg)' }}>
        <p style={{ color: 'var(--status-danger)', fontWeight: 'bold' }}>Error loading dashboard data. Please try again later.</p>
      </div>
    );
  }

  const { stats, completedQuizzesSummary } = statsData?.data || {
    stats: { totalQuizzes: 0, completedQuizzes: 0, activeQuizzes: 0, totalInstructors: 0, totalParticipants: 0 },
    completedQuizzesSummary: [],
  };

  const quizzes = quizzesData?.data || [];

  // Filter quizzes that are upcoming (Scheduled) or live (Live)
  const activeQuizzesList = quizzes.filter(
    (q) => q.status === QuizStatus.SCHEDULED || q.status === QuizStatus.LIVE
  );

  const formatDate = (dateStr: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateStr));
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.titleSection}>
        <h1>Dashboard Overview</h1>
        <p>Monitor quiz metrics, manage assessments, and assign roles.</p>
      </div>

      {/* Stats Counter Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📝</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Total Quizzes</div>
            <div className={styles.statValue}>{stats.totalQuizzes}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⚡</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Active Quizzes</div>
            <div className={styles.statValue}>{stats.activeQuizzes}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎓</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Instructors</div>
            <div className={styles.statValue}>{stats.totalInstructors}</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Participants</div>
            <div className={styles.statValue}>{stats.totalParticipants}</div>
          </div>
        </div>
      </div>

      {/* Completed Quizzes (Analytics Summary) */}
      <div>
        <h2 className={styles.sectionTitle}>Completed Quizzes Analytics</h2>
        <div className={styles.card}>
          {completedQuizzesSummary.length === 0 ? (
            <div className={styles.emptyState}>No completed quizzes yet. Once quizzes are finished, their results will appear here.</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Quiz Title</th>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Participants Attempted</th>
                    <th>Average Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {completedQuizzesSummary.map((quiz: any) => (
                    <tr key={quiz.id}>
                      <td style={{ fontWeight: 'bold' }}>{quiz.title}</td>
                      <td>{formatDate(quiz.scheduleTime)}</td>
                      <td>{quiz.duration} mins</td>
                      <td>{quiz.totalParticipants}</td>
                      <td>
                        <span style={{
                          color: quiz.averageScore >= 70 ? 'var(--status-success)' : quiz.averageScore >= 40 ? 'var(--status-warning)' : 'var(--status-danger)',
                          fontWeight: 'bold',
                        }}>
                          {quiz.averageScore}%
                        </span>
                      </td>
                      <td>
                        <Link to={`/admin/quizzes/${quiz.id}/results`} className={styles.actionBtn}>
                          📊 View Results
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Active & Scheduled Quizzes */}
      <div>
        <div className={styles.sectionTitle}>
          <h2>Active & Scheduled Quizzes</h2>
          <Link to="/admin/quizzes/create" className={styles.actionBtn} style={{ background: 'var(--brand-primary)', color: 'var(--text-inverse)', borderColor: 'var(--brand-primary)' }}>
            ➕ Create New Quiz
          </Link>
        </div>
        
        <div className={styles.card}>
          {activeQuizzesList.length === 0 ? (
            <div className={styles.emptyState}>No active or scheduled quizzes. Click 'Create New Quiz' to schedule one.</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Quiz Title</th>
                    <th>Schedule Time</th>
                    <th>Duration</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Participants Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeQuizzesList.map((quiz: any) => (
                    <tr key={quiz.id}>
                      <td style={{ fontWeight: 'bold' }}>{quiz.title}</td>
                      <td>{formatDate(quiz.scheduleTime)}</td>
                      <td>{quiz.duration} mins</td>
                      <td>{quiz.questionType === 'SINGLE_SELECT' ? 'Single Choice' : 'Multiple Choice'}</td>
                      <td>
                        <span className={styles.badge} style={{
                          background: quiz.status === 'LIVE' ? 'var(--status-success-bg)' : 'var(--status-info-bg)',
                          color: quiz.status === 'LIVE' ? 'var(--status-success)' : 'var(--status-info)',
                        }}>
                          {quiz.status}
                        </span>
                      </td>
                      <td>{quiz.participantCount || 0} attempts</td>
                      <td>
                        <Link to={`/admin/quizzes/${quiz.id}/edit`} className={styles.actionBtn}>
                          ✏️ Edit Quiz
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
