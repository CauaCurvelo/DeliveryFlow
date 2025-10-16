/// <reference types="cypress" />

describe('Alteração de Status de Pedido', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.contains('Pedidos').click();
  });

  it('deve alterar o status de um pedido', () => {
    // Aguarda os pedidos serem carregados e clica no primeiro card visível
    cy.get('div[class*="bg-card"][class*="rounded-xl"][class*="cursor-pointer"]', { timeout: 10000 })
      .first()
      .should('be.visible')
      .click();
    
    // No modal de detalhe do pedido, faz scroll até o botão e clica
    cy.contains('button', 'Em Preparo', { timeout: 5000 }).scrollIntoView().should('be.visible').click();
    
    // Aguarda a atualização do status
    cy.wait(500);
    
    // Verifica se o badge de status foi atualizado
    cy.contains('Em Preparo').should('be.visible');
  });
});
