/// <reference types="cypress" />

describe('Painel Administrativo', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve renderizar a aba Cardápio', () => {
    cy.contains('Cardápio').should('be.visible');
  });

  it('deve navegar para a aba Pedidos', () => {
    cy.contains('Pedidos').click();
    // Aguarda a navegação e verifica se o conteúdo da aba Pedidos está visível
    cy.contains('Filtros:', { timeout: 5000 }).should('be.visible');
  });
});
