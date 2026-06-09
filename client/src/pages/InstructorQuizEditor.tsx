import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useGetInstructorQuizByIdQuery,
  useUpdateInstructorQuizMutation,
  usePublishQuizMutation,
  useCancelInstructorQuizMutation,
  useAddQuestionsManualMutation,
  useUploadQuestionsCSVMutation,
  useAddParticipantsMutation,
  useUploadParticipantsCSVMutation,
} from '../store';
import { QuestionType, QuizStatus } from '../types';
import { CancelModal } from '../molecules/CancelModal';
import { CSVUploader } from '../molecules/CSVUploader';
import styles from './InstructorQuizEditor.module.scss';

type Tab = 'details' | 'questions' | 'participants';

interface ManualQuestion {
  questionText: string;
  options: { label: string; text: string }[];
  correctAnswers: string[];
}

const defaultOptions = () => [
  { label: 'A', text: '' },
  { label: 'B', text: '' },
  { label: 'C', text: '' },
  { label: 'D', text: '' },
];

const InstructorQuizEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<Tab>('details');

  // Load Data
  const { data: quizRes, isLoading: isLoadLoading, error } = useGetInstructorQuizByIdQuery(id!, {
    skip: !id,
  });

  // Mutations
  const [updateQuiz, { isLoading: isUpdateLoading }] = useUpdateInstructorQuizMutation();
  const [publishQuiz, { isLoading: isPublishLoading }] = usePublishQuizMutation();
  const [cancelQuiz, { isLoading: isCancelLoading }] = useCancelInstructorQuizMutation();
  const [addQuestionsManual, { isLoading: isSaveQuestionsLoading }] = useAddQuestionsManualMutation();
  const [uploadQuestionsCSV] = useUploadQuestionsCSVMutation();
  const [addParticipants, { isLoading: isAddParticipantLoading }] = useAddParticipantsMutation();
  const [uploadParticipantsCSV] = useUploadParticipantsCSVMutation();

  // Details Tab Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [scheduleTime, setScheduleTime] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.SINGLE_SELECT);

  // Manual Question Builder State
  const [isManualQuestionOpen, setIsManualQuestionOpen] = useState(false);
  const [manualQuestionText, setManualQuestionText] = useState('');
  const [manualOptions, setManualOptions] = useState(defaultOptions());
  const [manualCorrect, setManualCorrect] = useState<string[]>([]);

  // Manual Participant State
  const [participantEmail, setParticipantEmail] = useState('');

  // Alerts
  const [alertSuccess, setAlertSuccess] = useState('');
  const [alertError, setAlertError] = useState('');

  // Cancel Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Populate form details
  useEffect(() => {
    if (quizRes?.success && quizRes.data) {
      const { quiz } = quizRes.data;
      setTitle(quiz.title);
      setDescription(quiz.description || '');
      setDuration(quiz.duration.toString());
      setQuestionType(quiz.questionType);

      // format ISO Date to local timezone for datetime-local input
      const date = new Date(quiz.scheduleTime);
      const tzoffset = date.getTimezoneOffset() * 60000;
      const formattedDate = new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
      setScheduleTime(formattedDate);
    }
  }, [quizRes]);

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertSuccess('');
    setAlertError('');

    try {
      await updateQuiz({
        id: id!,
        body: {
          title,
          description,
          duration: Number(duration),
          scheduleTime: new Date(scheduleTime).toISOString(),
          questionType,
        },
      }).unwrap();
      setAlertSuccess('Details updated successfully!');
    } catch (err: any) {
      setAlertError(err?.data?.message || err?.message || 'Failed to update details.');
    }
  };

  const handlePublish = async () => {
    setAlertSuccess('');
    setAlertError('');
    try {
      const res = await publishQuiz(id!).unwrap();
      setAlertSuccess(`Quiz published successfully as ${res.data.status}!`);
    } catch (err: any) {
      setAlertError(err?.data?.message || err?.message || 'Failed to publish quiz.');
    }
  };

  const handleConfirmCancel = async () => {
    setAlertSuccess('');
    setAlertError('');
    try {
      await cancelQuiz(id!).unwrap();
      setIsCancelModalOpen(false);
      navigate('/instructor/dashboard');
    } catch (err: any) {
      setAlertError(err?.data?.message || err?.message || 'Failed to cancel quiz.');
      setIsCancelModalOpen(false);
    }
  };

  // Manual Question Addition
  const handleManualCorrectToggle = (label: string) => {
    if (questionType === QuestionType.SINGLE_SELECT) {
      setManualCorrect([label]);
    } else {
      if (manualCorrect.includes(label)) {
        setManualCorrect(manualCorrect.filter((l) => l !== label));
      } else {
        setManualCorrect([...manualCorrect, label]);
      }
    }
  };

  const handleAddQuestionManualSubmit = async () => {
    setAlertSuccess('');
    setAlertError('');

    if (!manualQuestionText.trim()) {
      setAlertError('Question prompt cannot be empty.');
      return;
    }

    for (let opt of manualOptions) {
      if (!opt.text.trim()) {
        setAlertError(`Please fill option ${opt.label}.`);
        return;
      }
    }

    if (manualCorrect.length === 0) {
      setAlertError('Please select at least 1 correct answer.');
      return;
    }

    const newQuestion: ManualQuestion = {
      questionText: manualQuestionText,
      options: manualOptions,
      correctAnswers: manualCorrect,
    };

    const currentQuestions = quizRes?.data?.questions || [];
    const updatedQuestions = [
      ...currentQuestions.map((q) => ({
        questionText: q.questionText,
        options: q.options.map((o) => ({ label: o.label, text: o.text })),
        correctAnswers: q.correctAnswers,
      })),
      newQuestion,
    ];

    try {
      await addQuestionsManual({ id: id!, questions: updatedQuestions }).unwrap();
      setAlertSuccess('Question added successfully!');
      setManualQuestionText('');
      setManualOptions(defaultOptions());
      setManualCorrect([]);
      setIsManualQuestionOpen(false);
    } catch (err: any) {
      setAlertError(err?.data?.message || err?.message || 'Failed to save question.');
    }
  };

  // Inline Participant Addition
  const handleAddParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertSuccess('');
    setAlertError('');

    if (!participantEmail.trim()) {
      setAlertError('Please enter a valid email.');
      return;
    }

    try {
      await addParticipants({ id: id!, emails: [participantEmail.trim()] }).unwrap();
      setAlertSuccess('Participant added successfully!');
      setParticipantEmail('');
    } catch (err: any) {
      setAlertError(err?.data?.message || err?.message || 'Failed to add participant.');
    }
  };

  if (isLoadLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ border: '4px solid var(--border-primary)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error || !quizRes?.success) {
    return (
      <div className={styles.card} style={{ borderColor: 'var(--status-danger)', background: 'var(--status-danger-bg)' }}>
        <p style={{ color: 'var(--status-danger)', fontWeight: 'bold' }}>Error loading quiz. Please try again later.</p>
      </div>
    );
  }

  const { quiz, questions, participants } = quizRes.data;
  const isCancelled = quiz.status === QuizStatus.CANCELLED;
  const isCompleted = quiz.status === QuizStatus.COMPLETED;

  // Determine readiness
  const hasQuestions = questions.length > 0;
  const hasParticipants = participants.length > 0;
  const isReadyToPublish = quiz.duration > 0 && hasQuestions && hasParticipants;

  return (
    <div className={styles.editorContainer}>
      <div className={styles.headerRow}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Edit Assessment Draft</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Current Status: <strong>{quiz.status}</strong>
          </p>
        </div>
        <Link to="/instructor/dashboard" className={styles.backBtn}>
          Back to Dashboard
        </Link>
      </div>

      {/* Alert Banners */}
      {alertSuccess && (
        <div className={`${styles.alert} ${styles.success}`}>
          <span>✅</span>
          <div>{alertSuccess}</div>
        </div>
      )}

      {alertError && (
        <div className={`${styles.alert} ${styles.danger}`}>
          <span>⚠️</span>
          <div>{alertError}</div>
        </div>
      )}

      {/* Tabs list */}
      <div className={styles.tabsRow}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'details' ? styles.active : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Assessment Info
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'questions' ? styles.active : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          Questions ({questions.length})
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'participants' ? styles.active : ''}`}
          onClick={() => setActiveTab('participants')}
        >
          Assigned Participants ({participants.length})
        </button>
      </div>

      {/* Tab: Details */}
      {activeTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <form onSubmit={handleUpdateDetails} className={styles.card}>
            <h3>Details & Settings</h3>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Quiz Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUpdateLoading || isCancelled}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={isUpdateLoading || isCancelled}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  disabled={isUpdateLoading || isCancelled}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Choice Option Type</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                  disabled={isUpdateLoading || isCancelled}
                >
                  <option value={QuestionType.SINGLE_SELECT}>Single Choice (Radio)</option>
                  <option value={QuestionType.MULTI_SELECT}>Multiple Choice (Checkbox)</option>
                </select>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Guidelines / Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isUpdateLoading || isCancelled}
              />
            </div>

            {!isCancelled && !isCompleted && (
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={isUpdateLoading}
                style={{ width: 'fit-content' }}
              >
                {isUpdateLoading ? 'Updating...' : 'Save Settings'}
              </button>
            )}
          </form>

          {/* Readiness Indicators Card */}
          <div className={styles.checklist}>
            <h4>Publishing Readiness Checklist</h4>
            <div
              className={`${styles.checkItem} ${quiz.duration > 0 ? styles.success : ''
                }`}
            >
              <span>{quiz.duration > 0 ? '✓' : '✖'}</span>
              <span>Quiz duration is set ({quiz.duration} mins)</span>
            </div>
            <div className={`${styles.checkItem} ${hasQuestions ? styles.success : ''}`}>
              <span>{hasQuestions ? '✓' : '✖'}</span>
              <span>Has at least 1 question prompt ({questions.length} saved)</span>
            </div>
            <div className={`${styles.checkItem} ${hasParticipants ? styles.success : ''}`}>
              <span>{hasParticipants ? '✓' : '✖'}</span>
              <span>Has at least 1 assigned participant ({participants.length} assigned)</span>
            </div>

            {/* Publishing Control Board */}
            {!isCancelled && !isCompleted && (
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {quiz.status === QuizStatus.DRAFT && (
                  <button
                    className={styles.saveBtn}
                    onClick={handlePublish}
                    disabled={!isReadyToPublish || isPublishLoading}
                    style={{
                      background: isReadyToPublish ? 'var(--status-success)' : 'var(--neutral-300)',
                      borderColor: isReadyToPublish ? 'var(--status-success)' : 'var(--neutral-300)',
                      color: isReadyToPublish ? 'var(--text-inverse)' : 'var(--text-tertiary)',
                      cursor: isReadyToPublish ? 'pointer' : 'not-allowed',
                    }}
                  >
                    🚀 Publish Assessment
                  </button>
                )}

                {quiz.status === QuizStatus.SCHEDULED && (
                  <button
                    className={styles.saveBtn}
                    onClick={handlePublish}
                    disabled={isPublishLoading}
                    style={{ background: 'var(--brand-accent)', borderColor: 'var(--brand-accent)' }}
                  >
                    🚀 Re-publish / Sync Status
                  </button>
                )}

                <button
                  className={styles.cancelBtn}
                  onClick={() => setIsCancelModalOpen(true)}
                  style={{ color: 'var(--status-danger)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'var(--status-danger-bg)' }}
                  disabled={isCancelLoading}
                >
                  🚫 Cancel Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Questions */}
      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* CSV Upload Section */}
          {!isCancelled && !isCompleted && (
            <div className={styles.card}>
              <h3>CSV Questions Uploader</h3>
              <CSVUploader
                onUpload={(file) => uploadQuestionsCSV({ id: id!, file }).unwrap()}
                acceptInfo="Required columns: questionText, optionA, optionB, optionC, optionD, correctAnswers (e.g. A,B)"
              />
            </div>
          )}

          {/* Manual Entry Section */}
          {!isCancelled && !isCompleted && (
            <div className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Manual Question Builder</h3>
                <button
                  className={styles.cancelBtn}
                  style={{ fontSize: '0.875rem' }}
                  onClick={() => setIsManualQuestionOpen(!isManualQuestionOpen)}
                >
                  {isManualQuestionOpen ? 'Close Editor' : '➕ Add Question manually'}
                </button>
              </div>

              {isManualQuestionOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
                  <div className={styles.inputGroup}>
                    <label>Question Prompt Text</label>
                    <textarea
                      placeholder="Enter question prompt..."
                      value={manualQuestionText}
                      onChange={(e) => setManualQuestionText(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                      Options (Check correct labels)
                    </label>
                    {manualOptions.map((opt, idx) => (
                      <div key={opt.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type={questionType === QuestionType.SINGLE_SELECT ? 'radio' : 'checkbox'}
                          name="manual_correct_answers"
                          checked={manualCorrect.includes(opt.label)}
                          onChange={() => handleManualCorrectToggle(opt.label)}
                        />
                        <span style={{ fontWeight: 'bold', width: '15px' }}>{opt.label}</span>
                        <input
                          type="text"
                          placeholder={`Option ${opt.label}...`}
                          value={opt.text}
                          onChange={(e) => {
                            const updated = [...manualOptions];
                            updated[idx].text = e.target.value;
                            setManualOptions(updated);
                          }}
                          style={{
                            flex: 1,
                            padding: '6px 12px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: '4px',
                            color: 'var(--text-primary)',
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => setIsManualQuestionOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.saveBtn}
                      onClick={handleAddQuestionManualSubmit}
                      disabled={isSaveQuestionsLoading}
                    >
                      Save Question
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Questions List */}
          <div className={styles.card}>
            <h3>Questions List ({questions.length})</h3>
            {questions.length === 0 ? (
              <div className={styles.emptyState}>No questions added. Add questions manual or upload CSV.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {questions.map((q: any, idx: number) => (
                  <div key={q._id || idx} className={styles.subCard}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                      Question {idx + 1}: {q.questionText}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                      {q.options.map((opt: any) => (
                        <div key={opt.label} className={styles.optionRow}>
                          <span style={{ fontWeight: 'bold' }}>{opt.label}.</span>
                          <span>{opt.text}</span>
                          {q.correctAnswers.includes(opt.label) && (
                            <span className={styles.correctDot}>Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Participants */}
      {activeTab === 'participants' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Add Inline & CSV Upload wrappers */}
          {!isCancelled && !isCompleted && (
            <div className={styles.formGrid}>
              <form onSubmit={handleAddParticipantSubmit} className={styles.card}>
                <h3>Inline Assign Participant</h3>
                <div className={styles.inlineFormRow}>
                  <div className={styles.inputGroup} style={{ flex: 1 }}>
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. participant@domain.com"
                      value={participantEmail}
                      onChange={(e) => setParticipantEmail(e.target.value)}
                      disabled={isAddParticipantLoading}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={isAddParticipantLoading}
                  >
                    Add Email
                  </button>
                </div>
              </form>

              <div className={styles.card}>
                <h3>CSV Upload Participants</h3>
                <CSVUploader
                  onUpload={(file) => uploadParticipantsCSV({ id: id!, file }).unwrap()}
                  acceptInfo="Required column: email"
                />
              </div>
            </div>
          )}

          {/* Participants List */}
          <div className={styles.card}>
            <h3>Assigned Participants Table ({participants.length})</h3>
            {participants.length === 0 ? (
              <div className={styles.emptyState}>No participants assigned. Add email manually or upload CSV.</div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Assigned At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p: any) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 'bold' }}>{p.name}</td>
                        <td>{p.email}</td>
                        <td>{new Date(p.assignedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      <CancelModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        isLoading={isCancelLoading}
      />
    </div>
  );
};

export default InstructorQuizEditor;
