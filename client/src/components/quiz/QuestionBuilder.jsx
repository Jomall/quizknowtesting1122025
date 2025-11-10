import React, { useState, useEffect } from 'react';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Grid,
  FormControlLabel,
  Switch,
} from '@mui/material';
import CustomDialog from '../common/CustomDialog';
import {
  Add,
  Delete,
  DragIndicator,
} from '@mui/icons-material';

const QuestionBuilder = ({ question, onSave, onCancel }) => {
  const [currentQuestion, setCurrentQuestion] = useState(question || {
    type: 'multiple-choice',
    question: '',
    options: ['', ''],
    correctAnswer: '',
    points: 1,
    explanation: '',
    isRequired: true,
  });

  // Ensure correctAnswer is properly initialized for select-all and matching questions
  useEffect(() => {
    if (currentQuestion.type === 'select-all' && !Array.isArray(currentQuestion.correctAnswer)) {
      setCurrentQuestion(prev => ({
        ...prev,
        correctAnswer: []
      }));
    }
    if (currentQuestion.type === 'matching' && !Array.isArray(currentQuestion.correctAnswer)) {
      setCurrentQuestion(prev => ({
        ...prev,
        correctAnswer: currentQuestion.rightItems || []
      }));
    }
  }, [currentQuestion.type, currentQuestion.correctAnswer, currentQuestion.rightItems]);

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    handleQuestionChange('options', newOptions);
  };

  const handleAddOption = () => {
    handleQuestionChange('options', [...currentQuestion.options, '']);
  };

  const handleRemoveOption = (index) => {
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    handleQuestionChange('options', newOptions);
  };

  const handleSave = () => {
    // For matching questions, set correctAnswer to rightItems for backward compatibility
    let questionToSave = { ...currentQuestion };
    if (currentQuestion.type === 'matching') {
      questionToSave.correctAnswer = currentQuestion.rightItems || [];
    }
    onSave(questionToSave);
  };

  const renderQuestionType = () => {
    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Multiple Choice Options
            </Typography>
            {currentQuestion.options.map((option, index) => (
              <Box key={index} display="flex" alignItems="center" mb={2}>
                <TextField
                  fullWidth
                  label={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  variant="outlined"
                />
                <IconButton onClick={() => handleRemoveOption(index)} disabled={currentQuestion.options.length <= 2}>
                  <Delete />
                </IconButton>
              </Box>
            ))}
            <Button
              startIcon={<Add />}
              onClick={handleAddOption}
              disabled={currentQuestion.options.length >= 6}
            >
              Add Option
            </Button>

            <FormControl fullWidth margin="normal">
              <InputLabel>Correct Answer</InputLabel>
              <Select
                value={currentQuestion.correctAnswer}
                onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
              >
                {currentQuestion.options && Array.isArray(currentQuestion.options) ? (
                  currentQuestion.options.map((option, index) => (
                    <MenuItem key={index} value={option} disabled={!option.trim()}>
                      {option || `Option ${index + 1}`}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No options available</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
        );

      case 'true-false':
        return (
          <FormControl fullWidth margin="normal">
            <InputLabel>Correct Answer</InputLabel>
            <Select
              value={currentQuestion.correctAnswer}
              onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
            >
              <MenuItem value="true">True</MenuItem>
              <MenuItem value="false">False</MenuItem>
            </Select>
          </FormControl>
        );

      case 'short-answer':
        return (
          <TextField
            fullWidth
            label="Correct Answer (keywords)"
            value={currentQuestion.correctAnswer}
            onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
            margin="normal"
            helperText="Enter keywords separated by commas"
          />
        );

      case 'essay':
        return (
          <TextField
            fullWidth
            label="Rubric/Guidelines"
            value={currentQuestion.correctAnswer}
            onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
            margin="normal"
            multiline
            rows={3}
            helperText="Provide grading criteria or expected response structure"
          />
        );

      case 'fill-in-the-blank':
        return (
          <Box>
            <TextField
              fullWidth
              label="Question with blank"
              value={currentQuestion.question}
              onChange={(e) => handleQuestionChange('question', e.target.value)}
              margin="normal"
              helperText="Use [blank] to indicate where the blank should appear"
            />
            <TextField
              fullWidth
              label="Correct Answer"
              value={currentQuestion.correctAnswer}
              onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
              margin="normal"
            />
          </Box>
        );

      case 'select-all':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select All That Apply Options
            </Typography>
            {currentQuestion.options && currentQuestion.options.length > 0 ? (
              currentQuestion.options.map((option, index) => (
                <Box key={index} display="flex" alignItems="center" mb={2}>
                  <TextField
                    fullWidth
                    label={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    variant="outlined"
                  />
                  <IconButton onClick={() => handleRemoveOption(index)} disabled={currentQuestion.options.length <= 2}>
                    <Delete />
                  </IconButton>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="error">
                No options available. Please add at least 2 options.
              </Typography>
            )}
            <Button
              startIcon={<Add />}
              onClick={handleAddOption}
              disabled={currentQuestion.options.length >= 6}
            >
              Add Option
            </Button>

            <TextField
              fullWidth
              label="Correct Answers (comma-separated)"
              value={Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer.join(', ') : (currentQuestion.correctAnswer || '')}
              onChange={(e) => {
                const value = e.target.value;
                const parsed = value.split(',').map(s => s.trim()).filter(s => s);
                handleQuestionChange('correctAnswer', parsed.length > 0 ? parsed : []);
              }}
              margin="normal"
              helperText="Enter the correct options separated by commas (e.g., Option 1, Option 3)"
            />
          </Box>
        );

      case 'matching':
        // Initialize leftItems and rightItems if they don't exist
        const leftItems = currentQuestion.leftItems || ['', ''];
        const rightItems = currentQuestion.rightItems || ['', ''];

        const handleRemoveLeftItem = (index) => {
          const newItems = leftItems.filter((_, i) => i !== index);
          handleQuestionChange('leftItems', newItems);
        };

        const handleRemoveRightItem = (index) => {
          const newItems = rightItems.filter((_, i) => i !== index);
          handleQuestionChange('rightItems', newItems);
        };

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Matching Pairs
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Create pairs of terms and their definitions. Students will match them correctly.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Terms (Left Side)</Typography>
                {leftItems.map((item, index) => (
                  <Box key={index} display="flex" alignItems="center" mb={1}>
                    <TextField
                      fullWidth
                      label={`Term ${index + 1}`}
                      value={item}
                      onChange={(e) => {
                        const newItems = [...leftItems];
                        newItems[index] = e.target.value;
                        handleQuestionChange('leftItems', newItems);
                      }}
                      margin="normal"
                      placeholder="Enter term"
                      size="small"
                    />
                    <IconButton
                      onClick={() => handleRemoveLeftItem(index)}
                      disabled={leftItems.length <= 2}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<Add />}
                  onClick={() => handleQuestionChange('leftItems', [...leftItems, ''])}
                  disabled={leftItems.length >= 6}
                  size="small"
                  fullWidth
                >
                  Add Term
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Definitions (Right Side)</Typography>
                {rightItems.map((item, index) => (
                  <Box key={index} display="flex" alignItems="center" mb={1}>
                    <TextField
                      fullWidth
                      label={`Definition ${index + 1}`}
                      value={item}
                      onChange={(e) => {
                        const newItems = [...rightItems];
                        newItems[index] = e.target.value;
                        handleQuestionChange('rightItems', newItems);
                      }}
                      margin="normal"
                      placeholder="Enter definition"
                      size="small"
                    />
                    <IconButton
                      onClick={() => handleRemoveRightItem(index)}
                      disabled={rightItems.length <= 2}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  startIcon={<Add />}
                  onClick={() => handleQuestionChange('rightItems', [...rightItems, ''])}
                  disabled={rightItems.length >= 6}
                  size="small"
                  fullWidth
                >
                  Add Definition
                </Button>
              </Grid>
            </Grid>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Note: Ensure you have the same number of terms and definitions for proper matching.
            </Typography>
          </Box>
        );

      case 'ordering':
        const handleDragStart = (e, index) => {
          e.dataTransfer.setData('text/plain', index);
        };

        const handleDragOver = (e) => {
          e.preventDefault();
        };

        const handleDrop = (e, dropIndex) => {
          e.preventDefault();
          const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
          if (dragIndex === dropIndex) return;

          const newOptions = [...currentQuestion.options];
          const [draggedItem] = newOptions.splice(dragIndex, 1);
          newOptions.splice(dropIndex, 0, draggedItem);

          handleQuestionChange('options', newOptions);
        };

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Ordering Items
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Add items that students need to put in the correct order. Drag and drop to reorder them. The order you set here will be the correct answer.
            </Typography>
            {currentQuestion.options && currentQuestion.options.length > 0 ? (
              currentQuestion.options.map((option, index) => (
                <Box
                  key={index}
                  display="flex"
                  alignItems="center"
                  mb={2}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  sx={{
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    p: 1,
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  <DragIndicator sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ mr: 2, minWidth: '30px' }}>
                    {index + 1}.
                  </Typography>
                  <TextField
                    fullWidth
                    label={`Item ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    variant="outlined"
                    placeholder="Enter item to be ordered"
                  />
                  <IconButton onClick={() => handleRemoveOption(index)} disabled={currentQuestion.options.length <= 2}>
                    <Delete />
                  </IconButton>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="error">
                No items available. Please add at least 2 items to order.
              </Typography>
            )}
            <Button
              startIcon={<Add />}
              onClick={handleAddOption}
              disabled={currentQuestion.options.length >= 6}
            >
              Add Item
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <CustomDialog open={true} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle>
        {question ? 'Edit Question' : 'Add New Question'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Question Type</InputLabel>
              <Select
                value={currentQuestion.type}
                onChange={(e) => handleQuestionChange('type', e.target.value)}
              >
                <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                <MenuItem value="true-false">True/False</MenuItem>
                <MenuItem value="short-answer">Short Answer</MenuItem>
                <MenuItem value="essay">Essay</MenuItem>
                <MenuItem value="fill-in-the-blank">Fill in the Blank</MenuItem>
                <MenuItem value="select-all">Select All That Apply</MenuItem>
                <MenuItem value="matching">Matching</MenuItem>
                <MenuItem value="ordering">Ordering</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Points"
              type="number"
              value={currentQuestion.points}
              onChange={(e) => handleQuestionChange('points', parseInt(e.target.value))}
              margin="normal"
              inputProps={{ min: 1, max: 100 }}
            />
          </Grid>
        </Grid>

        <TextField
          fullWidth
          label="Question"
          value={currentQuestion.question}
          onChange={(e) => handleQuestionChange('question', e.target.value)}
          margin="normal"
          multiline
          rows={3}
        />

        {renderQuestionType()}

        <TextField
          fullWidth
          label="Explanation (optional)"
          value={currentQuestion.explanation}
          onChange={(e) => handleQuestionChange('explanation', e.target.value)}
          margin="normal"
          multiline
          rows={2}
          helperText="This will be shown to students after they answer"
        />

        <FormControlLabel
          control={
            <Switch
              checked={currentQuestion.isRequired}
              onChange={(e) => handleQuestionChange('isRequired', e.target.checked)}
            />
          }
          label="Required Question"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Question
        </Button>
      </DialogActions>
    </CustomDialog>
  );
};

export default QuestionBuilder;
