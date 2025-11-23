describe('Fill In The Blank Quiz', () => {
  before(() => {
    cy.visit('/student-dashboard')
  })

  it('Loads the student dashboard page', () => {
    cy.url().should('include', '/student-dashboard')
    cy.contains('Available Quizzes').should('be.visible')
  })

  it('Can start a fill in the blank quiz and submit an answer', () => {
    cy.contains('Take Quiz').first().click()
    // Assuming quiz page has input 'answer' to type in
    cy.get('input[name="answer"]').type('Test answer')
    cy.get('button[type="submit"]').click()

    cy.contains('Your answer has been submitted').should('be.visible')
  })
})
