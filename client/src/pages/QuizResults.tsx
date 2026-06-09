import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetQuizResultsQuery } from '../store';
import styles from './QuizResults.module.scss';

const QuizResults: React.FC = () => {
  const { id } = useParams();

  const { data: resultsData, isLoading, error } = useGetQuizResultsQuery(id!, {
    skip: !id,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ border: '4px solid var(--border-primary)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error || !resultsData?.success) {
    return (
      <div className={styles.tableCard} style={{ borderColor: 'var(--status-danger)', background: 'var(--status-danger-bg)' }}>
        <p style={{ color: 'var(--status-danger)', fontWeight: 'bold' }}>
          Error loading results details. Please try again later.
        </p>
      </div>
    );
  }

  const { quiz, chartData, results } = resultsData.data;
  const { fail, pass, excellent } = chartData;
  const totalAttempts = results.length;

  // Donut chart calculations
  const totalScored = fail + pass + excellent;
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16

  const pExc = totalScored > 0 ? excellent / totalScored : 0;
  const pPass = totalScored > 0 ? pass / totalScored : 0;
  const pFail = totalScored > 0 ? fail / totalScored : 0;

  const lExc = pExc * circumference;
  const lPass = pPass * circumference;
  const lFail = pFail * circumference;

  const avgPercentage = totalAttempts > 0
    ? Math.round(results.reduce((acc: number, r: any) => acc + r.percentage, 0) / totalAttempts)
    : 0;

  const highestScore = totalAttempts > 0
    ? Math.max(...results.map((r: any) => r.percentage))
    : 0;

  const formatDate = (dateStr: string | Date | undefined) => {
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

  return (
    <div className={styles.resultsContainer}>
      <div className={styles.headerRow}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Results Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Assessment: <strong>{quiz.title}</strong> | Status: <strong>{quiz.status}</strong>
          </p>
        </div>
        <Link to="/admin/dashboard" className={styles.backBtn}>
          Back to Dashboard
        </Link>
      </div>

      {/* Analytics Donut Chart & Stat Cards Grid */}
      <div className={styles.analyticsGrid}>
        {/* Left: Donut Chart */}
        <div className={styles.chartCard}>
          <h3>Score Distribution</h3>

          <div style={{ position: 'relative', width: '160px', height: '160px' }}>
            <svg width="160" height="160" className={styles.donutSvg}>
              {/* Outer track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="var(--bg-tertiary)"
                strokeWidth="15"
              />

              {totalScored === 0 ? (
                // Empty chart circle
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke="var(--neutral-300)"
                  strokeWidth="15"
                />
              ) : (
                <>
                  {/* Segment 1: Excellent (Green) */}
                  {excellent > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke="var(--status-success)"
                      strokeWidth="15"
                      strokeDasharray={`${lExc} ${circumference}`}
                      strokeDashoffset="0"
                    />
                  )}

                  {/* Segment 2: Pass (Amber) */}
                  {pass > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke="var(--status-warning)"
                      strokeWidth="15"
                      strokeDasharray={`${lPass} ${circumference}`}
                      strokeDashoffset={`-${lExc}`}
                    />
                  )}

                  {/* Segment 3: Fail (Red) */}
                  {fail > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke="var(--status-danger)"
                      strokeWidth="15"
                      strokeDasharray={`${lFail} ${circumference}`}
                      strokeDashoffset={`-${lExc + lPass}`}
                    />
                  )}
                </>
              )}

              {/* Text overlays in center */}
              <text x="80" y="80" textAnchor="middle" dy=".3em" className={styles.chartCenterText}>
                {totalScored}
              </text>
              <text x="80" y="96" textAnchor="middle" className={styles.chartCenterSubtext}>
                Attempts
              </text>
            </svg>
          </div>

          {/* Legend Items */}
          <div className={styles.legendList}>
            <div className={styles.legendItem}>
              <div className={styles.legendLabel}>
                <div className={styles.colorDot} style={{ background: 'var(--status-success)' }}></div>
                <span>Excellent (&ge;70%)</span>
              </div>
              <div className={styles.legendValue}>{excellent} ({Math.round(pExc * 100)}%)</div>
            </div>

            <div className={styles.legendItem}>
              <div className={styles.legendLabel}>
                <div className={styles.colorDot} style={{ background: 'var(--status-warning)' }}></div>
                <span>Pass (40-70%)</span>
              </div>
              <div className={styles.legendValue}>{pass} ({Math.round(pPass * 100)}%)</div>
            </div>

            <div className={styles.legendItem}>
              <div className={styles.legendLabel}>
                <div className={styles.colorDot} style={{ background: 'var(--status-danger)' }}></div>
                <span>Fail (&lt;40%)</span>
              </div>
              <div className={styles.legendValue}>{fail} ({Math.round(pFail * 100)}%)</div>
            </div>
          </div>
        </div>

        {/* Right: Info Cards Column */}
        <div className={styles.statsCol}>
          <div className={styles.infoCard}>
            <span className={styles.cardLabel}>Average Score</span>
            <span className={styles.cardVal}>{avgPercentage}%</span>
          </div>

          <div className={styles.infoCard}>
            <span className={styles.cardLabel}>Highest Score</span>
            <span className={styles.cardVal}>{highestScore}%</span>
          </div>

          <div className={styles.infoCard}>
            <span className={styles.cardLabel}>Total Attempts</span>
            <span className={styles.cardVal}>{totalAttempts}</span>
          </div>
        </div>
      </div>

      {/* Student Scores Table */}
      <div className={styles.tableCard}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.25rem' }}>Participant Scoreboard</h3>
        {results.length === 0 ? (
          <div className={styles.emptyState}>No attempts recorded for this quiz yet.</div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Email</th>
                  <th>Submission Time</th>
                  <th>Time Taken</th>
                  <th>Score Summary</th>
                  <th>Final Percentage</th>
                </tr>
              </thead>
              <tbody>
                {results.map((record: any) => (
                  <tr key={record.attemptId}>
                    <td style={{ fontWeight: 'bold' }}>{record.participantName}</td>
                    <td>{record.participantEmail}</td>
                    <td>{formatDate(record.submittedAt || record.startedAt)}</td>
                    <td>{formatDuration(record.timeTaken)}</td>
                    <td>
                      <span style={{ color: 'var(--status-success)', fontWeight: 'semibold' }}>✔ {record.correct}</span>
                      <span style={{ color: 'var(--status-danger)', fontWeight: 'semibold', marginLeft: '8px' }}>✖ {record.wrong}</span>
                      <span style={{ color: 'var(--text-tertiary)', fontWeight: 'semibold', marginLeft: '8px' }}>⚪ {record.skipped}</span>
                    </td>
                    <td>
                      <span
                        className={styles.scoreBadge}
                        style={{
                          color:
                            record.percentage >= 70
                              ? 'var(--status-success)'
                              : record.percentage >= 40
                              ? 'var(--status-warning)'
                              : 'var(--status-danger)',
                        }}
                      >
                        {record.percentage}%
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

export default QuizResults;
