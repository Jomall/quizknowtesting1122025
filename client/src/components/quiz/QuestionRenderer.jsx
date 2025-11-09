import React from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  TextField,
  FormControl,
  FormLabel,
  Chip,
  Grid,
} from '@mui/material';

// Fixed: Added safe array handling to prevent map errors on undefined arrays

const QuestionRenderer = ({ question, questionIndex, totalQuestions, currentAnswer, onAnswerChange }) => {
  console.log('QuestionRenderer received question:', question);
  console.log('Question type:', question?.type);
  console.log('Question properties:', Object.keys(question || {}));

  if (!question) {
    console.error('QuestionRenderer: question prop is null or undefined');
    return (
      <Box>
        <Typography variant="body1" color="error">
          Question data is not available.
        </Typography>
      </Box>
    );
  }

  if (!question.type) {
    console.error('QuestionRenderer: question.type is missing', question);
    return (
      <Box>
        <Typography variant="body1" color="error">
          Question type is not available.
        </Typography>
      </Box>
    );
  }

  const handleAnswerChange = (value) => {
    onAnswerChange(question._id, value);
  };

  const renderQuestionType = () => {
    console.log('renderQuestionType called for question type:', question.type);
    switch (question.type) {
      case 'multiple-choice':
        console.log('Multiple-choice question data:', {
          options: question.options,
          optionsType: typeof question.options,
          optionsIsArray: Array.isArray(question.options)
        });

        // Safe array access with defaults
        const options = Array.isArray(question.options) ? question.options : [];

        return (
          <FormControl component="fieldset">
            <FormLabel component="legend">{question.question}</FormLabel>
            <RadioGroup
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
            >
              {options.length > 0 ? (
                options.map((option, index) => (
                  <FormControlLabel
                    key={option._id || index}
                    value={option.text}
                    control={<Radio />}
                    label={option.text}
                  />
                ))
              ) : (
                <Typography variant="body2" color="error">
                  Options not available for this question.
                </Typography>
              )}
            </RadioGroup>
          </FormControl>
        );

      case 'short-answer':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {question.question}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Enter your answer here..."
            />
          </Box>
        );

      case 'select-all':
        console.log('Select-all question data:', {
          options: question.options,
          optionsType: typeof question.options,
          optionsIsArray: Array.isArray(question.options),
          questionText: question.question
        });

        // Safe array access with defaults
        const selectAllOptions = Array.isArray(question.options) ? question.options : [];
        console.log('selectAllOptions array:', selectAllOptions);

        return (
          <FormControl component="fieldset">
            <FormLabel component="legend">{question.question}</FormLabel>
            <FormGroup>
              {selectAllOptions.length > 0 ? (
                selectAllOptions.map((option, index) => {
                  console.log('Mapping select-all option:', option, 'at index:', index);
                  return (
                    <FormControlLabel
                      key={option._id || index}
                      control={
                        <Checkbox
                          checked={currentAnswer?.includes(option.text) || false}
                          onChange={(e) => {
                            const newAnswer = e.target.checked
                              ? [...(currentAnswer || []), option.text]
                              : (currentAnswer || []).filter(item => item !== option.text);
                            handleAnswerChange(newAnswer);
                          }}
                        />
                      }
                      label={option.text}
                    />
                  );
                })
              ) : (
                <Typography variant="body2" color="error">
                  Options not available for this question.
                </Typography>
              )}
            </FormGroup>
          </FormControl>
        );

      case 'fill-in-the-blank':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {question.question}
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Fill in the blank..."
            />
          </Box>
        );

      case 'essay':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {question.question}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Write your essay here..."
            />
          </Box>
        );

      case 'true-false':
        return (
          <FormControl component="fieldset">
            <FormLabel component="legend">{question.question}</FormLabel>
            <RadioGroup
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
            >
              <FormControlLabel value="true" control={<Radio />} label="True" />
              <FormControlLabel value="false" control={<Radio />} label="False" />
            </RadioGroup>
          </FormControl>
        );

      case 'matching':
        console.log('Matching question data:', {
          leftItems: question.leftItems,
          rightItems: question.rightItems,
          leftItemsType: typeof question.leftItems,
          rightItemsType: typeof question.rightItems,
          leftItemsIsArray: Array.isArray(question.leftItems),
          rightItemsIsArray: Array.isArray(question.rightItems)
        });

        // Safe array access with defaults
        const leftItems = Array.isArray(question.leftItems) ? question.leftItems : [];
        const rightItems = Array.isArray(question.rightItems) ? question.rightItems : [];

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {question.question}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Items to Match:
                </Typography>
                {leftItems.length > 0 ? (
                  leftItems.map((item, index) => (
                    <Box key={index} mb={1}>
                      <Chip label={item} />
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="error">
                    Left items not available.
                  </Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Match with:
                </Typography>
                {rightItems.length > 0 ? (
                  rightItems.map((item, index) => (
                    <Box key={index} mb={1}>
                      <TextField
                        select
                        label={`Match ${item}`}
                        value={currentAnswer?.[item] || ''}
                        onChange={(e) => {
                          const newAnswer = { ...(currentAnswer || {}), [item]: e.target.value };
                          handleAnswerChange(newAnswer);
                        }}
                        SelectProps={{ native: true }}
                        fullWidth
                      >
                        <option value="">Select match</option>
                        {leftItems.length > 0 ? (
                          leftItems.map((leftItem, leftIndex) => (
                            <option key={leftIndex} value={leftItem}>
                              {leftItem}
                            </option>
                          ))
                        ) : (
                          <option disabled>No options available</option>
                        )}
                      </TextField>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="error">
                    Right items not available.
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        );

      case 'ordering':
        console.log('Ordering question data:', {
          items: question.items,
          itemsType: typeof question.items,
          itemsIsArray: Array.isArray(question.items),
          questionText: question.question
        });

        // Safe array access with defaults
        const items = Array.isArray(question.items) ? question.items : [];
        console.log('ordering items array:', items);

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {question.question}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Drag and drop to reorder the items correctly
            </Typography>
            {items.length > 0 ? (
              items.map((item, index) => {
                console.log('Mapping ordering item:', item, 'at index:', index);
                return (
                  <Box key={index} mb={1}>
                    <TextField
                      type="number"
                      label={`Position for: ${item}`}
                      value={currentAnswer?.[item] || ''}
                      onChange={(e) => {
                        const newAnswer = { ...(currentAnswer || {}), [item]: parseInt(e.target.value) };
                        handleAnswerChange(newAnswer);
                      }}
                      inputProps={{ min: 1, max: items.length }}
                      fullWidth
                    />
                  </Box>
                );
              })
            ) : (
              <Typography variant="body2" color="error">
                Items not available for ordering.
              </Typography>
            )}
          </Box>
        );

      default:
        return (
          <Typography variant="body1">
            Unknown question type: {question.type}
          </Typography>
        );
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Question {questionIndex + 1} of {totalQuestions}
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Type: {question.type}
      </Typography>
      {question.points && (
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Points: {question.points}
        </Typography>
      )}
      <Box mt={2}>
        {renderQuestionType()}
      </Box>
    </Box>
  );
};

export default QuestionRenderer;
