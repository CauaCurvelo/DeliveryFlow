/// <reference types="cypress" />

describe('Submit de Produto via MenuEditor', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.contains('Cardápio').click();
  });

  it('deve submeter um novo produto', () => {
    cy.contains('Novo Produto').click();
    cy.get('input#name').type('Produto Cypress');
    cy.get('textarea#description').type('Descrição teste');
    cy.get('input#price').type('19.99');
    cy.get('input#category').type('Testes');
    cy.get('input#image').type('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400');
    cy.contains('button', 'Adicionar Produto').click();
    cy.contains('Produto Cypress', { timeout: 10000 }).should('be.visible');
  });
});
