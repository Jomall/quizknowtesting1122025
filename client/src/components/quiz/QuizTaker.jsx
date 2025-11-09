import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../../context/QuizContext';
import QuestionRenderer from './QuestionRenderer';
import ProgressBar from './ProgressBar';
import Timer from './Timer';
import QuizNavigation from './QuizNavigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';

const QuizTaker = ({ quizId }) => {
  const {
    currentQuiz,
    session,
    answers,
    loading,
    error,
    completed,
    fetchQuiz,
    startQuiz,
    updateAnswer,
    submitQuiz,
  } = useQuiz();

  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (quizId) {
      fetchQuiz(quizId);
    }
  }, [quizId, fetchQuiz]);

  useEffect(() => {
    if (currentQuiz && !session) {
      startQuiz(currentQuiz._id);
    }
  }, [currentQuiz, session, startQuiz]);

  const handleAnswerChange = (questionId, answer) => {
    updateAnswer(questionId, answer);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    submitQuiz();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!currentQuiz || !session) {
    return (
      <Box p={3}>
        <Alert severity="info">Loading quiz...</Alert>
      </Box>
    );
  }

  if (completed) {
    return (
      <Box p={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Quiz Completed!
            </Typography>
            <Typography variant="body1">
              Thank you for completing the quiz. Your results will be available shortly.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => navigate(`/quiz/${currentQuiz._id}/results`)}
            >
              View Results
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const currentQuestion = currentQuiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;

  return (
    <Box p={3}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {currentQuiz.title}
          </Typography>

          <Box mb={3}>
            <ProgressBar progress={progress} />
            <Timer timeRemaining={session.timeRemaining} />
          </Box>

          {currentQuestion ? (
            <QuestionRenderer
              question={currentQuestion}
              questionIndex={currentQuestionIndex}
              totalQuestions={currentQuiz.questions.length}
              currentAnswer={answers[currentQuestion._id]}
              onAnswerChange={handleAnswerChange}
            />
          ) : (
            <Typography variant="body1" color="error">
              Question data is not available.
            </Typography>
          )}

          <QuizNavigation
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={currentQuiz.questions.length}
            onNext={handleNextQuestion}
            onPrevious={handlePreviousQuestion}
            onSubmit={handleSubmitQuiz}
            isLastQuestion={currentQuestionIndex === currentQuiz.questions.length - 1}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default QuizTaker;
