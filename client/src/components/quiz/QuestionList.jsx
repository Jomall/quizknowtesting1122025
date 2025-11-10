import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import QuestionBuilder from './QuestionBuilder';

const QuestionList = ({ questions, onChange }) => {
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  const handleAddQuestion = () => {
    const newQuestion = {
      type: 'multiple-choice',
      question: '',
      options: ['', ''],
      correctAnswer: '',
      points: 1,
      explanation: '',
    };
    setEditingQuestion(newQuestion);
    setEditingIndex(null);
  };

  const handleEditQuestion = (index) => {
    setEditingQuestion(questions[index]);
    setEditingIndex(index);
  };

  const handleSaveQuestion = (question) => {
    let updatedQuestions;
    if (editingIndex !== null) {
      updatedQuestions = [...questions];
      updatedQuestions[editingIndex] = question;
    } else {
      updatedQuestions = [...questions, question];
    }
    onChange(updatedQuestions);
    setEditingQuestion(null);
    setEditingIndex(null);
  };

  const handleDeleteQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    onChange(updatedQuestions);
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditingIndex(null);
  };

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'multiple-choice': return 'Multiple Choice';
      case 'true-false': return 'True/False';
      case 'short-answer': return 'Short Answer';
      case 'essay': return 'Essay';
      case 'fill-in-the-blank': return 'Fill in the Blank';
      case 'select-all': return 'Select All';
      case 'matching': return 'Matching';
      case 'ordering': return 'Ordering';
      default: return type;
    }
  };

  const renderQuestionPreview = (question, index) => {
    return (
      <Box key={index} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle1">
            Q{index + 1}: {question.question}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip label={`${question.points} pts`} size="small" />
            <Chip label={getQuestionTypeLabel(question.type)} size="small" />
            <IconButton size="small" onClick={() => handleEditQuestion(index)}>
              <Edit fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => handleDeleteQuestion(index)}>
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {question.type === 'multiple-choice' && question.options && (
          <Box sx={{ ml: 2 }}>
            {question.options.map((option, optIndex) => (
              <Box key={optIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {option === question.correctAnswer ? (
                  <CheckCircle fontSize="small" color="success" />
                ) : (
                  <RadioButtonUnchecked fontSize="small" />
                )}
                <Typography variant="body2">{option}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {question.type === 'true-false' && (
          <Box sx={{ ml: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {question.correctAnswer === 'true' ? (
                <CheckCircle fontSize="small" color="success" />
              ) : (
                <RadioButtonUnchecked fontSize="small" />
              )}
              <Typography variant="body2">True</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {question.correctAnswer === 'false' ? (
                <CheckCircle fontSize="small" color="success" />
              ) : (
                <RadioButtonUnchecked fontSize="small" />
              )}
              <Typography variant="body2">False</Typography>
            </Box>
          </Box>
        )}

        {(question.type === 'short-answer' || question.type === 'essay') && question.correctAnswer && (
          <Box sx={{ ml: 2 }}>
            <Typography variant="body2" color="success.main">
              Correct: {question.correctAnswer}
            </Typography>
          </Box>
        )}

        {question.type === 'matching' && Array.isArray(question.leftItems) && Array.isArray(question.rightItems) && (
          <Box sx={{ ml: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Pattern Matching Pairs:
            </Typography>
            {question.leftItems.map((leftItem, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                <Typography variant="body2" sx={{ minWidth: '150px' }}>
                  {leftItem}
                </Typography>
                <Typography variant="body2" sx={{ color: 'success.main' }}>
                  → {question.rightItems[idx] || ''}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Questions ({questions.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddQuestion}
        >
          Add Question
        </Button>
      </Box>

      {questions.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No questions added yet. Click "Add Question" to get started.
        </Typography>
      ) : (
        <Box>
          {questions.map((question, index) => renderQuestionPreview(question, index))}
        </Box>
      )}

      {editingQuestion && (
        <QuestionBuilder
          question={editingQuestion}
          onSave={handleSaveQuestion}
          onCancel={handleCancelEdit}
        />
      )}
    </Box>
  );
};

export default QuestionList;
