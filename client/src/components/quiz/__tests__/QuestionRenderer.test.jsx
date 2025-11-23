import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionRenderer from '../QuestionRenderer';

describe('QuestionRenderer Fill-in-the-Blank Tests', () => {
  const sampleQuestionSingleBlank = {
    _id: 'q1',
    type: 'fill-in-the-blank',
    question: 'The capital of France is [blank].',
    blanks: [
      {
        id: 'blank1',
        correctAnswer: 'Paris',
        alternativeAnswers: ['paris city', 'City of Paris'],
        size: 'medium',
        hint: 'Capital city of France'
      }
    ],
    points: 1
  };

  const sampleQuestionMultipleBlanks = {
    _id: 'q2',
    type: 'fill-in-the-blank',
    question: 'The [blank] is the largest planet and [blank] has rings.',
    blanks: [
      {
        id: 'blank1',
        correctAnswer: 'Jupiter',
        alternativeAnswers: ['jove', 'gas giant'],
        size: 'medium',
        hint: 'Largest planet'
      },
      {
        id: 'blank2',
        correctAnswer: 'Saturn',
        alternativeAnswers: [],
        size: 'medium',
        hint: 'Planet with rings'
      }
    ],
    points: 2
  };

  it('renders single blank question with input and accepts typing', () => {
    const handleAnswerChange = jest.fn();
    render(
      <QuestionRenderer
        question={sampleQuestionSingleBlank}
        questionIndex={0}
        totalQuestions={1}
        currentAnswer={['']}
        onAnswerChange={handleAnswerChange}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'Paris' } });
    expect(handleAnswerChange).toHaveBeenCalledWith('q1', ['Paris']);
  });

  it('renders multiple blanks and updates each independently', () => {
    const handleAnswerChange = jest.fn();
    const currentAnswers = ['', ''];
    render(
      <QuestionRenderer
        question={sampleQuestionMultipleBlanks}
        questionIndex={1}
        totalQuestions={1}
        currentAnswer={currentAnswers}
        onAnswerChange={handleAnswerChange}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(2);
    fireEvent.change(inputs[0], { target: { value: 'Jupiter' } });
    expect(handleAnswerChange).toHaveBeenCalledWith('q2', ['Jupiter', '']);
    fireEvent.change(inputs[1], { target: { value: 'Saturn' } });
    expect(handleAnswerChange).toHaveBeenCalledWith('q2', ['Jupiter', 'Saturn']);
  });

  it('displays hints properly next to blanks', () => {
    render(
      <QuestionRenderer
        question={sampleQuestionMultipleBlanks}
        questionIndex={1}
        totalQuestions={1}
        currentAnswer={['', '']}
        onAnswerChange={() => {}}
      />
    );

    expect(screen.getByText('Largest planet')).toBeInTheDocument();
    expect(screen.getByText('Planet with rings')).toBeInTheDocument();
  });
});
