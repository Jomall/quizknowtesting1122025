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
  const getInitialQuestion = (question) => {
    if (question) {
      // Ensure correctAnswer is properly initialized for existing questions
      let correctAnswer = question.correctAnswer;
      if (question.type === 'select-all' && !Array.isArray(correctAnswer)) {
        correctAnswer = [];
      } else if (question.type === 'matching') {
        // Initialize leftItems and rightItems for matching questions
        const leftItems = question.leftItems || question.options || ['', ''];
        const rightItems = question.rightItems || (Array.isArray(correctAnswer) ? correctAnswer : ['', '']);
        correctAnswer = rightItems;
        return { ...question, correctAnswer, leftItems, rightItems };
      } else if (!correctAnswer) {
        correctAnswer = '';
      }
      return { ...question, correctAnswer };
    }
    return {
      type: 'multiple-choice',
      question: '',
      options: ['', ''],
      correctAnswer: '',
      points: 1,
      explanation: '',
      isRequired: true,
      alternativeAnswers: [],
      gradingOptions: {
        usePartialCredit: true,
        useSemanticSimilarity: true,
        useSynonyms: true,
        useStemming: true,
        useFuzzyMatching: true,
        fuzzyThreshold: 0.8,
        semanticWeight: 0.3,
        keywordWeight: 0.7,
      },
      keywordWeights: {},
    };
  };

  const [currentQuestion, setCurrentQuestion] = useState(() => getInitialQuestion(question));

  // Update state when question prop changes (for editing different questions)
  useEffect(() => {
    setCurrentQuestion(getInitialQuestion(question));
  }, [question]);

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
    setCurrentQuestion(prev => {
      const newQuestion = {
        ...prev,
        [field]: value,
      };
      if (field === 'type') {
        if (value === 'select-all') {
          newQuestion.correctAnswer = [];
        } else if (value === 'matching') {
          newQuestion.correctAnswer = newQuestion.rightItems || [];
          newQuestion.leftItems = newQuestion.leftItems || ['', ''];
          newQuestion.rightItems = newQuestion.rightItems || ['', ''];
        } else {
          newQuestion.correctAnswer = '';
        }
      }
      return newQuestion;
    });
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
          <Box>
            <TextField
              fullWidth
              label="Primary Correct Answer"
              value={currentQuestion.correctAnswer}
              onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
              margin="normal"
              helperText="Enter the main correct answer"
            />

            {/* Alternative Answers */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Alternative Correct Answers
            </Typography>
            {currentQuestion.alternativeAnswers && currentQuestion.alternativeAnswers.length > 0 ? (
              currentQuestion.alternativeAnswers.map((alt, index) => (
                <Box key={index} display="flex" alignItems="center" mb={2}>
                  <TextField
                    fullWidth
                    label={`Alternative Answer ${index + 1}`}
                    value={alt.text || alt}
                    onChange={(e) => {
                      const newAlts = [...currentQuestion.alternativeAnswers];
                      if (typeof alt === 'string') {
                        newAlts[index] = e.target.value;
                      } else {
                        newAlts[index] = { ...alt, text: e.target.value };
                      }
                      handleQuestionChange('alternativeAnswers', newAlts);
                    }}
                    variant="outlined"
                  />
                  <IconButton
                    onClick={() => {
                      const newAlts = currentQuestion.alternativeAnswers.filter((_, i) => i !== index);
                      handleQuestionChange('alternativeAnswers', newAlts);
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary" gutterBottom>
                No alternative answers added yet.
              </Typography>
            )}
            <Button
              startIcon={<Add />}
              onClick={() => {
                const newAlts = currentQuestion.alternativeAnswers || [];
                newAlts.push({ text: '', weights: {} });
                handleQuestionChange('alternativeAnswers', newAlts);
              }}
              size="small"
            >
              Add Alternative Answer
            </Button>

            {/* Grading Options */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Grading Options
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentQuestion.gradingOptions?.usePartialCredit ?? true}
                      onChange={(e) => handleQuestionChange('gradingOptions', {
                        ...currentQuestion.gradingOptions,
                        usePartialCredit: e.target.checked
                      })}
                    />
                  }
                  label="Use Partial Credit"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentQuestion.gradingOptions?.useSemanticSimilarity ?? true}
                      onChange={(e) => handleQuestionChange('gradingOptions', {
                        ...currentQuestion.gradingOptions,
                        useSemanticSimilarity: e.target.checked
                      })}
                    />
                  }
                  label="Use Semantic Similarity"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentQuestion.gradingOptions?.useSynonyms ?? true}
                      onChange={(e) => handleQuestionChange('gradingOptions', {
                        ...currentQuestion.gradingOptions,
                        useSynonyms: e.target.checked
                      })}
                    />
                  }
                  label="Use Synonyms"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentQuestion.gradingOptions?.useStemming ?? true}
                      onChange={(e) => handleQuestionChange('gradingOptions', {
                        ...currentQuestion.gradingOptions,
                        useStemming: e.target.checked
                      })}
                    />
                  }
                  label="Use Stemming"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={currentQuestion.gradingOptions?.useFuzzyMatching ?? true}
                      onChange={(e) => handleQuestionChange('gradingOptions', {
                        ...currentQuestion.gradingOptions,
                        useFuzzyMatching: e.target.checked
                      })}
                    />
                  }
                  label="Use Fuzzy Matching (Typos)"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fuzzy Threshold"
                  type="number"
                  value={currentQuestion.gradingOptions?.fuzzyThreshold ?? 0.8}
                  onChange={(e) => handleQuestionChange('gradingOptions', {
                    ...currentQuestion.gradingOptions,
                    fuzzyThreshold: parseFloat(e.target.value) || 0.8
                  })}
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                  helperText="Similarity threshold for fuzzy matching (0-1)"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Semantic Weight"
                  type="number"
                  value={currentQuestion.gradingOptions?.semanticWeight ?? 0.3}
                  onChange={(e) => handleQuestionChange('gradingOptions', {
                    ...currentQuestion.gradingOptions,
                    semanticWeight: parseFloat(e.target.value) || 0.3
                  })}
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                  helperText="Weight for semantic similarity (0-1)"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Keyword Weight"
                  type="number"
                  value={currentQuestion.gradingOptions?.keywordWeight ?? 0.7}
                  onChange={(e) => handleQuestionChange('gradingOptions', {
                    ...currentQuestion.gradingOptions,
                    keywordWeight: parseFloat(e.target.value) || 0.7
                  })}
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                  helperText="Weight for keyword matching (0-1)"
                />
              </Grid>
            </Grid>

            {/* Keyword Weights */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Keyword Weights (Optional)
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Assign weights to important keywords in the primary answer. Higher weights give more importance to those keywords.
            </Typography>
            <TextField
              fullWidth
              label="Keyword Weights (JSON format)"
              value={currentQuestion.keywordWeights ? JSON.stringify(currentQuestion.keywordWeights, null, 2) : '{}'}
              onChange={(e) => {
                try {
                  const weights = JSON.parse(e.target.value);
                  handleQuestionChange('keywordWeights', weights);
                } catch (error) {
                  // Invalid JSON, keep current value
                }
              }}
              margin="normal"
              multiline
              rows={3}
              helperText='Example: {"photosynthesis": 2.0, "chlorophyll": 1.5, "sunlight": 1.0}'
              error={(() => {
                try {
                  JSON.parse(currentQuestion.keywordWeights ? JSON.stringify(currentQuestion.keywordWeights) : '{}');
                  return false;
                } catch {
                  return true;
                }
              })()}
            />
          </Box>
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
        // Initialize blanks if not present (for backward compatibility)
        const blanks = currentQuestion.blanks || [];
        const hasLegacyFormat = !currentQuestion.blanks && currentQuestion.correctAnswer;

        // Convert legacy format to new format if needed
        const effectiveBlanks = hasLegacyFormat ? [{
          id: 'blank-1',
          correctAnswer: currentQuestion.correctAnswer || '',
          alternativeAnswers: currentQuestion.alternativeAnswers || [],
          keywordWeights: currentQuestion.keywordWeights || {},
          gradingOptions: currentQuestion.gradingOptions || {
            usePartialCredit: true,
            useSemanticSimilarity: true,
            useSynonyms: true,
            useStemming: true,
            useFuzzyMatching: true,
            fuzzyThreshold: 0.8,
            semanticWeight: 0.3,
            keywordWeight: 0.7,
            caseSensitive: false
          },
          size: 'medium',
          hint: '',
          points: 1
        }] : blanks;

        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Question with Blanks
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Use [blank] to indicate where blanks should appear. Each [blank] will create an input field.
            </Typography>
            <TextField
              fullWidth
              label="Question Text"
              value={currentQuestion.question}
              onChange={(e) => handleQuestionChange('question', e.target.value)}
              margin="normal"
              multiline
              rows={3}
              helperText="Example: The process of [blank] uses [blank] to produce [blank]."
            />

            {/* Blanks Configuration */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Blank Configurations
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Configure each blank with correct answers and grading options.
            </Typography>

            {effectiveBlanks.length > 0 ? (
              effectiveBlanks.map((blank, index) => (
                <Box key={blank.id || index} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1">
                      Blank {index + 1}
                    </Typography>
                    <IconButton
                      onClick={() => {
                        const newBlanks = effectiveBlanks.filter((_, i) => i !== index);
                        handleQuestionChange('blanks', newBlanks);
                      }}
                      disabled={effectiveBlanks.length <= 1}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Correct Answer"
                        value={blank.correctAnswer || ''}
                        onChange={(e) => {
                          const newBlanks = [...effectiveBlanks];
                          newBlanks[index] = { ...blank, correctAnswer: e.target.value };
                          handleQuestionChange('blanks', newBlanks);
                        }}
                        helperText="The primary correct answer for this blank"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Size</InputLabel>
                        <Select
                          value={blank.size || 'medium'}
                          onChange={(e) => {
                            const newBlanks = [...effectiveBlanks];
                            newBlanks[index] = { ...blank, size: e.target.value };
                            handleQuestionChange('blanks', newBlanks);
                          }}
                        >
                          <MenuItem value="small">Small</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="large">Large</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Hint (optional)"
                        value={blank.hint || ''}
                        onChange={(e) => {
                          const newBlanks = [...effectiveBlanks];
                          newBlanks[index] = { ...blank, hint: e.target.value };
                          handleQuestionChange('blanks', newBlanks);
                        }}
                        helperText="Optional hint shown to students"
                      />
                    </Grid>
                  </Grid>

                  {/* Alternative Answers for this blank */}
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Alternative Answers
                  </Typography>
                  {blank.alternativeAnswers && blank.alternativeAnswers.length > 0 ? (
                    blank.alternativeAnswers.map((alt, altIndex) => (
                      <Box key={altIndex} display="flex" alignItems="center" mb={1}>
                        <TextField
                          fullWidth
                          label={`Alternative ${altIndex + 1}`}
                          value={alt.text || alt}
                          onChange={(e) => {
                            const newBlanks = [...effectiveBlanks];
                            const newAlts = [...blank.alternativeAnswers];
                            if (typeof alt === 'string') {
                              newAlts[altIndex] = e.target.value;
                            } else {
                              newAlts[altIndex] = { ...alt, text: e.target.value };
                            }
                            newBlanks[index] = { ...blank, alternativeAnswers: newAlts };
                            handleQuestionChange('blanks', newBlanks);
                          }}
                          size="small"
                        />
                        <IconButton
                          onClick={() => {
                            const newBlanks = [...effectiveBlanks];
                            const newAlts = blank.alternativeAnswers.filter((_, i) => i !== altIndex);
                            newBlanks[index] = { ...blank, alternativeAnswers: newAlts };
                            handleQuestionChange('blanks', newBlanks);
                          }}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      No alternative answers.
                    </Typography>
                  )}
                  <Button
                    startIcon={<Add />}
                    onClick={() => {
                      const newBlanks = [...effectiveBlanks];
                      const newAlts = blank.alternativeAnswers || [];
                      newAlts.push({ text: '', weights: {} });
                      newBlanks[index] = { ...blank, alternativeAnswers: newAlts };
                      handleQuestionChange('blanks', newBlanks);
                    }}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Add Alternative
                  </Button>

                  {/* Grading Options for this blank */}
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Grading Options
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6} sm={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={blank.gradingOptions?.usePartialCredit ?? true}
                            onChange={(e) => {
                              const newBlanks = [...effectiveBlanks];
                              newBlanks[index] = {
                                ...blank,
                                gradingOptions: {
                                  ...blank.gradingOptions,
                                  usePartialCredit: e.target.checked
                                }
                              };
                              handleQuestionChange('blanks', newBlanks);
                            }}
                          />
                        }
                        label="Partial Credit"
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={blank.gradingOptions?.useSynonyms ?? true}
                            onChange={(e) => {
                              const newBlanks = [...effectiveBlanks];
                              newBlanks[index] = {
                                ...blank,
                                gradingOptions: {
                                  ...blank.gradingOptions,
                                  useSynonyms: e.target.checked
                                }
                              };
                              handleQuestionChange('blanks', newBlanks);
                            }}
                          />
                        }
                        label="Synonyms"
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={blank.gradingOptions?.useFuzzyMatching ?? true}
                            onChange={(e) => {
                              const newBlanks = [...effectiveBlanks];
                              newBlanks[index] = {
                                ...blank,
                                gradingOptions: {
                                  ...blank.gradingOptions,
                                  useFuzzyMatching: e.target.checked
                                }
                              };
                              handleQuestionChange('blanks', newBlanks);
                            }}
                          />
                        }
                        label="Fuzzy Match"
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={blank.gradingOptions?.caseSensitive ?? false}
                            onChange={(e) => {
                              const newBlanks = [...effectiveBlanks];
                              newBlanks[index] = {
                                ...blank,
                                gradingOptions: {
                                  ...blank.gradingOptions,
                                  caseSensitive: e.target.checked
                                }
                              };
                              handleQuestionChange('blanks', newBlanks);
                            }}
                          />
                        }
                        label="Case Sensitive"
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary" gutterBottom>
                No blanks configured yet.
              </Typography>
            )}

            <Button
              startIcon={<Add />}
              onClick={() => {
                const newBlanks = [...effectiveBlanks, {
                  id: `blank-${effectiveBlanks.length + 1}`,
                  correctAnswer: '',
                  alternativeAnswers: [],
                  keywordWeights: {},
                  gradingOptions: {
                    usePartialCredit: true,
                    useSemanticSimilarity: true,
                    useSynonyms: true,
                    useStemming: true,
                    useFuzzyMatching: true,
                    fuzzyThreshold: 0.8,
                    semanticWeight: 0.3,
                    keywordWeight: 0.7,
                    caseSensitive: false
                  },
                  size: 'medium',
                  hint: '',
                  points: 1
                }];
                handleQuestionChange('blanks', newBlanks);
              }}
              size="small"
              sx={{ mt: 2 }}
            >
              Add Blank
            </Button>

            {/* Legacy format warning */}
            {hasLegacyFormat && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
                ⚠️ This question uses the old format. It will be automatically converted to the new multi-blank format when saved.
              </Typography>
            )}
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
        const leftItems = Array.isArray(currentQuestion.leftItems) ? currentQuestion.leftItems : ['', ''];
        const rightItems = Array.isArray(currentQuestion.rightItems) ? currentQuestion.rightItems : ['', ''];

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
              Pattern Matching Pairs
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Create pairs of patterns and their matches. Students will match patterns to their correct counterparts.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Patterns (Left Side)</Typography>
                {leftItems.map((item, index) => (
                  <Box key={index} display="flex" alignItems="center" mb={1}>
                    <TextField
                      fullWidth
                      label={`Pattern ${index + 1}`}
                      value={item}
                      onChange={(e) => {
                        const newItems = [...leftItems];
                        newItems[index] = e.target.value;
                        handleQuestionChange('leftItems', newItems);
                      }}
                      margin="normal"
                      placeholder="Enter pattern (e.g., term, concept, or visual pattern)"
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
                  Add Pattern
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Matches (Right Side)</Typography>
                {rightItems.map((item, index) => (
                  <Box key={index} display="flex" alignItems="center" mb={1}>
                    <TextField
                      fullWidth
                      label={`Match ${index + 1}`}
                      value={item}
                      onChange={(e) => {
                        const newItems = [...rightItems];
                        newItems[index] = e.target.value;
                        handleQuestionChange('rightItems', newItems);
                      }}
                      margin="normal"
                      placeholder="Enter corresponding match (e.g., definition, answer, or pattern match)"
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
                  Add Match
                </Button>
              </Grid>
            </Grid>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              Note: Ensure you have the same number of patterns and matches for proper pattern matching.
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
