import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useGetAdminQuizByIdQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useCancelQuizMutation,
} from '../store';
import { QuestionType, QuizStatus } from '../types';
import { CancelModal } from '../molecules/CancelModal';
import styles from './QuizForm.module.scss';

interface OptionInput {
  label: string;
  text: string;
}

interface QuestionInput {
  questionText: string;
  options: OptionInput[];
  correctAnswers: string[];
}

const defaultOptions = (): OptionInput[] => [
  { label: 'A', text: '' },
  { label: 'B', text: '' },
  { label: 'C', text: '' },
  { label: 'D', text: '' },
];

const QuizForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [scheduleTime, setScheduleTime] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.SINGLE_SELECT);
  const [questions, setQuestions] = useState<QuestionInput[]>([
    { questionText: '', options: defaultOptions(), correctAnswers: [] },
  ]);

  const [validationError, setValidationError] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // RTK Query hooks
  const { data: quizDetail, isLoading: isLoadQuizLoading } = useGetAdminQuizByIdQuery(id!, {
    skip: !isEditMode,
  });

  const [createQuiz, { isLoading: isCreateLoading }] = useCreateQuizMutation();
  const [updateQuiz, { isLoading: isUpdateLoading }] = useUpdateQuizMutation();
  const [cancelQuiz, { isLoading: isCancelLoading }] = useCancelQuizMutation();

  // Populate data in Edit Mode
  useEffect(() => {
    if (isEditMode && quizDetail?.success && quizDetail.data) {
      const { quiz, questions: quizQuestions } = quizDetail.data;
      setTitle(quiz.title);
      setDescription(quiz.description || '');
      setDuration(quiz.duration.toString());
      setQuestionType(quiz.questionType);
      
      // format scheduleTime date to YYYY-MM-DDTHH:MM for input type="datetime-local"
      const date = new Date(quiz.scheduleTime);
      const tzoffset = date.getTimezoneOffset() * 60000;
      const formattedDate = new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
      setScheduleTime(formattedDate);

      // Map questions
      if (quizQuestions && quizQuestions.length > 0) {
        const mappedQuestions = quizQuestions.map((q) => ({
          questionText: q.questionText,
          options: q.options.map((o) => ({ label: o.label, text: o.text })),
          correctAnswers: q.correctAnswers,
        }));
        setQuestions(mappedQuestions);
      }
    }
  }, [isEditMode, quizDetail]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: '', options: defaultOptions(), correctAnswers: [] },
    ]);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length === 1) {
      setValidationError('A quiz must contain at least 1 question.');
      return;
    }
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const handleQuestionTextChange = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].questionText = text;
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex].text = text;
    setQuestions(updated);
  };

  const handleCorrectAnswerToggle = (qIndex: number, label: string) => {
    const updated = [...questions];
    const question = updated[qIndex];

    if (questionType === QuestionType.SINGLE_SELECT) {
      question.correctAnswers = [label];
    } else {
      if (question.correctAnswers.includes(label)) {
        question.correctAnswers = question.correctAnswers.filter((ans) => ans !== label);
      } else {
        question.correctAnswers = [...question.correctAnswers, label];
      }
    }
    setQuestions(updated);
  };

  // Switch type triggers correctAnswers adjustments
  useEffect(() => {
    if (questionType === QuestionType.SINGLE_SELECT) {
      const updated = questions.map((q) => ({
        ...q,
        correctAnswers: q.correctAnswers.length > 0 ? [q.correctAnswers[0]] : [],
      }));
      setQuestions(updated);
    }
  }, [questionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Form Validations
    if (!title.trim() || title.trim().length < 3) {
      setValidationError('Title must be at least 3 characters long.');
      return;
    }

    if (!scheduleTime) {
      setValidationError('Please select a valid schedule time.');
      return;
    }

    const durationNum = Number(duration);
    if (isNaN(durationNum) || durationNum <= 0) {
      setValidationError('Please enter a positive duration in minutes.');
      return;
    }

    // Question Validations
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setValidationError(`Please enter text for Question ${i + 1}.`);
        return;
      }
      
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          setValidationError(`Please fill option ${q.options[j].label} for Question ${i + 1}.`);
          return;
        }
      }

      if (q.correctAnswers.length === 0) {
        setValidationError(`Please select at least 1 correct answer for Question ${i + 1}.`);
        return;
      }
    }

    const payload = {
      title,
      description,
      questionType,
      duration: durationNum,
      scheduleTime: new Date(scheduleTime).toISOString(),
      questions,
    };

    try {
      if (isEditMode) {
        await updateQuiz({ id: id!, body: payload }).unwrap();
      } else {
        await createQuiz(payload).unwrap();
      }
      navigate('/admin/dashboard');
    } catch (err: any) {
      setValidationError(err?.data?.message || err?.message || 'Failed to save quiz.');
    }
  };

  const handleCancelQuiz = async () => {
    try {
      await cancelQuiz(id!).unwrap();
      setIsCancelModalOpen(false);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setValidationError(err?.data?.message || err?.message || 'Failed to cancel quiz.');
      setIsCancelModalOpen(false);
    }
  };

  if (isEditMode && isLoadQuizLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ border: '4px solid var(--border-primary)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <div className={styles.headerSection}>
        <h1>{isEditMode ? 'Edit Assessment' : 'Create Assessment'}</h1>
        <Link to="/admin/dashboard" className={styles.cancelBtn}>
          Back to Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {validationError && (
          <div className={styles.card} style={{ borderColor: 'var(--status-danger)', background: 'var(--status-danger-bg)' }}>
            <p style={{ color: 'var(--status-danger)', fontSize: '0.875rem', margin: 0 }}>⚠️ {validationError}</p>
          </div>
        )}

        {/* Section 1: Quiz Details */}
        <div className={styles.card}>
          <h3>Assessment Information</h3>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="title">Quiz Title</label>
              <input
                id="title"
                type="text"
                placeholder="e.g. JavaScript Advanced MCQ"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="duration">Duration (minutes)</label>
              <input
                id="duration"
                type="number"
                min="1"
                placeholder="e.g. 45"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="schedule">Schedule Time</label>
              <input
                id="schedule"
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="type">Question Choice Type</label>
              <select
                id="type"
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              >
                <option value={QuestionType.SINGLE_SELECT}>Single Choice (Radio Button)</option>
                <option value={QuestionType.MULTI_SELECT}>Multiple Choice (Checkbox)</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="desc">Description (Optional)</label>
            <textarea
              id="desc"
              placeholder="Provide guidelines for participants..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Section 2: Questions Editor */}
        <div className={styles.questionsHeader}>
          <h2>Assessment Questions ({questions.length})</h2>
        </div>

        {questions.map((question, qIdx) => (
          <div key={qIdx} className={styles.questionCard}>
            <div className={styles.questionHeaderRow}>
              <h3>Question {qIdx + 1}</h3>
              <button
                type="button"
                className={styles.deleteQuestionBtn}
                onClick={() => handleDeleteQuestion(qIdx)}
              >
                🗑️ Delete Question
              </button>
            </div>

            <div className={styles.inputGroup}>
              <label>Question Prompt Text</label>
              <textarea
                placeholder="Enter question text here..."
                value={question.questionText}
                onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                required
              />
            </div>

            <div className={styles.optionsGrid}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                Options & Correct Answers ({questionType === QuestionType.SINGLE_SELECT ? 'Check only 1 correct answer' : 'Check all that apply'})
              </label>

              {question.options.map((opt, oIdx) => (
                <div key={oIdx} className={styles.optionRow}>
                  <div className={styles.checkboxWrapper}>
                    <input
                      type={questionType === QuestionType.SINGLE_SELECT ? 'radio' : 'checkbox'}
                      name={`question_${qIdx}_correct`}
                      checked={question.correctAnswers.includes(opt.label)}
                      onChange={() => handleCorrectAnswerToggle(qIdx, opt.label)}
                    />
                  </div>
                  <span className={styles.labelLetter}>{opt.label}</span>
                  <input
                    type="text"
                    placeholder={`Option text for ${opt.label}...`}
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button type="button" className={styles.addQuestionBtn} onClick={handleAddQuestion}>
          ➕ Add Question
        </button>

        {/* Form Controls */}
        <div className={styles.formFooter}>
          {isEditMode && quizDetail?.data?.quiz.status !== QuizStatus.CANCELLED && (
            <button
              type="button"
              className={styles.cancelQuizBtn}
              onClick={() => setIsCancelModalOpen(true)}
              style={{ marginRight: 'auto' }}
            >
              🚫 Cancel Quiz
            </button>
          )}

          <Link to="/admin/dashboard" className={styles.cancelBtn}>
            Cancel
          </Link>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isCreateLoading || isUpdateLoading}
          >
            {isCreateLoading || isUpdateLoading ? 'Saving...' : isEditMode ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </div>
      </form>

      {/* Cancel Confirmation Modal */}
      <CancelModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelQuiz}
        isLoading={isCancelLoading}
      />
    </div>
  );
};

export default QuizForm;
