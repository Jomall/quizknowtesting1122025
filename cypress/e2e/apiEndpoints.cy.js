describe('API Endpoints', () => {
  const apiBaseUrl = 'http://localhost:5000'

  it('should get my submissions', () => {
    cy.request(apiBaseUrl + '/api/submissions/my-submissions')
      .should((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('array')
      })
  })

  it('should get quizzes', () => {
    cy.request(apiBaseUrl + '/api/quizzes')
      .should((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('array')
      })
  })

  // Add more endpoint tests as needed
})
