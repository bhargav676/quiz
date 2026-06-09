import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetQuizAnalyticsQuery } from '../store';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend as RechartsLegend,
} from 'recharts';
import styles from './InstructorAnalytics.module.scss';

const COLORS = {
  excellent: '#10b981', // green
  pass: '#f59e0b',      // amber
  fail: '#ef4444',      // red
};

const InstructorAnalytics: React.FC = () => {
  const { id } = useParams();
  const { data: analyticsRes, isLoading, error } = useGetQuizAnalyticsQuery(id!, {
    skip: !id,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ border: '4px solid var(--border-primary)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error || !analyticsRes?.success) {
    return (
      <div className={styles.tableCard} style={{ borderColor: 'var(--status-danger)', background: 'var(--status-danger-bg)' }}>
        <p style={{ color: 'var(--status-danger)', fontWeight: 'bold' }}>
          Error loading quiz analytics. Please try again later.
        </p>
      </div>
    );
  }

  const { quiz, chartData, metrics, questionsBreakdown, attempts } = analyticsRes.data;
  const { fail, pass, excellent } = chartData;
  const { totalAttempts, averageScore } = metrics;

  // Pie chart data formatting
  const pieData = [
    { name: 'Excellent (>=70%)', value: excellent, color: COLORS.excellent },
    { name: 'Pass (40-70%)', value: pass, color: COLORS.pass },
    { name: 'Fail (<40%)', value: fail, color: COLORS.fail },
  ].filter((item) => item.value > 0); // only show segments with values > 0

  // Calculate pass rate
  const totalGraded = excellent + pass + fail;
  const passRate = totalGraded > 0 ? Math.round(((excellent + pass) / totalGraded) * 100) : 0;

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateStr));
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getAccuracyClass = (acc: number) => {
    if (acc >= 70) return styles.high;
    if (acc >= 40) return styles.mid;
    return styles.low;
  };

  return (
    <div className={styles.analyticsContainer}>
      <div className={styles.headerRow}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Assessment Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Assessment: <strong>{quiz.title}</strong> | Status: <strong>{quiz.status}</strong>
          </p>
        </div>
        <Link to="/instructor/dashboard" className={styles.backBtn}>
          Back to Dashboard
        </Link>
      </div>

      {/* Recharts Pie Chart & Stat Cards Grid */}
      <div className={styles.analyticsGrid}>
        {/* Left: Recharts Pie Chart */}
        <div className={styles.chartCard}>
          <h3>Grade Breakdown</h3>
          <div className={styles.rechartsWrapper}>
            {pieData.length === 0 ? (
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No attempts recorded.</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} participants`]} />
                  <RechartsLegend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right: Info Cards Grid */}
        <div className={styles.metricsCol}>
          <div className={styles.metricCard}>
            <span className={styles.label}>Total Attempts</span>
            <span className={styles.value}>{totalAttempts}</span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.label}>Average Score</span>
            <span className={styles.value}>{averageScore}%</span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.label}>Quiz Pass Rate</span>
            <span className={styles.value}>{passRate}%</span>
          </div>
        </div>
      </div>

      {/* Detailed Question by Question correctness view */}
      <div className={styles.tableCard}>
        <h3>Question-by-Question Diagnostics</h3>
        {questionsBreakdown.length === 0 ? (
          <div className={styles.emptyState}>No diagnostic metrics. Add questions to this quiz.</div>
        ) : (
          <div className={styles.qBreakdownGrid}>
            {questionsBreakdown.map((q: any, idx: number) => {
              const accuracyClass = getAccuracyClass(q.accuracy);
              return (
                <div key={q.id || idx} className={styles.qBreakdownItem}>
                  <div className={styles.qTextRow}>
                    Q{idx + 1}: {q.questionText}
                  </div>
                  <div className={styles.qStatsRow}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ color: 'var(--status-success)', fontWeight: '500' }}>
                        Correct: {q.correctCount}
                      </span>
                      <span style={{ color: 'var(--status-danger)', fontWeight: '500' }}>
                        Incorrect: {q.wrongCount}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)', fontWeight: '500' }}>
                        Skipped: {q.skippedCount}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className={`${styles.accuracyLabel} ${accuracyClass}`}>
                        Accuracy: {q.accuracy}%
                      </span>
                      <div className={styles.progressBar}>
                        <div
                          className={`${styles.fill} ${accuracyClass}`}
                          style={{ width: `${q.accuracy}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scoreboard List */}
      <div className={styles.tableCard}>
        <h3>Attempt Scoreboard</h3>
        {attempts.length === 0 ? (
          <div className={styles.emptyState}>No submissions received yet.</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Participant Name</th>
                  <th>Email Address</th>
                  <th>Time Taken</th>
                  <th>Submission Time</th>
                  <th>Score Percentage</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt: any) => (
                  <tr key={attempt.attemptId}>
                    <td style={{ fontWeight: 'bold' }}>{attempt.participantName}</td>
                    <td>{attempt.participantEmail}</td>
                    <td>{formatDuration(attempt.timeTaken)}</td>
                    <td>{formatDate(attempt.submittedAt)}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 'bold',
                          color:
                            attempt.percentage >= 70
                              ? COLORS.excellent
                              : attempt.percentage >= 40
                              ? COLORS.pass
                              : COLORS.fail,
                        }}
                      >
                        {attempt.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorAnalytics;
