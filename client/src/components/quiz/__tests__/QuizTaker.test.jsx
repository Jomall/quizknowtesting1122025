import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizTaker from '../QuizTaker';
import { QuizContext } from '../../context/QuizContext';

const sampleQuiz = {
  questions: [
    {
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
    }
  ]
};

const contextValue = {
  answers: { q1: [''] },
  updateAnswer: jest.fn()
};

describe('QuizTaker fill-in-the-blank interaction', () => {
  it('renders fill-in-the-blank question and updates answer on input', () => {
    render(
      <QuizContext.Provider value={contextValue}>
        <QuizTaker quiz={sampleQuiz} />
      </QuizContext.Provider>
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'Paris' } });
    expect(contextValue.updateAnswer).toHaveBeenCalledWith('q1', ['Paris']);
  });

  it('displays hint tooltip or text in fill-in-the-blank question', () => {
    render(
      <QuizContext.Provider value={contextValue}>
        <QuizTaker quiz={sampleQuiz} />
      </QuizContext.Provider>
    );
    expect(screen.getByText('Capital city of France')).toBeInTheDocument();
  });
});
