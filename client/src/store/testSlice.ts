import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TestState {
  currentQuestionIndex: number;
  answers: Record<string, string[]>;
  visited: Record<string, boolean>;
}

const initialState: TestState = {
  currentQuestionIndex: 0,
  answers: {},
  visited: {},
};

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    startTest: (state) => {
      state.currentQuestionIndex = 0;
      state.answers = {};
      state.visited = {};
    },
    setQuestionIndex: (state, action: PayloadAction<{ index: number; questionId?: string }>) => {
      state.currentQuestionIndex = action.payload.index;
      if (action.payload.questionId) {
        state.visited[action.payload.questionId] = true;
      }
    },
    markVisited: (state, action: PayloadAction<string>) => {
      state.visited[action.payload] = true;
    },
    setLocalAnswer: (state, action: PayloadAction<{ questionId: string; selectedAnswers: string[] }>) => {
      const { questionId, selectedAnswers } = action.payload;
      state.answers[questionId] = selectedAnswers;
      // Marking an answer as set also implicitly means it has been visited
      state.visited[questionId] = true;
    },
    clearTest: () => initialState,
  },
});

export const { startTest, setQuestionIndex, markVisited, setLocalAnswer, clearTest } = testSlice.actions;
export default testSlice.reducer;
