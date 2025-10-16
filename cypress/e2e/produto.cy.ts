/// <reference types="cypress" />

describe('Fluxo de Produto', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.contains('Cardápio').click();
  });
  
  it('deve exibir produto mockado', () => {
    cy.contains('Pizza Margherita G', { timeout: 8000 }).should('be.visible');
  });
  
  it('deve adicionar um novo produto', () => {
    cy.contains('Novo Produto', { timeout: 8000 }).click();
    cy.get('input#name').type('Produto Teste');
    cy.get('textarea#description').type('Descrição do produto teste');
    cy.get('input#price').type('9.99');
    cy.get('input#category').type('Testes');
    cy.get('input#image').type('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400');
    cy.contains('button', 'Adicionar Produto').click();
    cy.contains('Produto Teste', { timeout: 10000 }).should('be.visible');
  });
  
  it('deve editar um produto existente', () => {
    // Aguarda o produto estar visível antes de editar
    cy.contains('Pizza Margherita G', { timeout: 8000 }).should('be.visible');
    // Encontra o card do produto e clica no botão Editar
    cy.contains('Pizza Margherita G').closest('[class*="group"]').within(() => {
      cy.contains('button', 'Editar').click();
    });
    cy.get('input#name').clear().type('Produto Editado');
    cy.contains('button', 'Salvar Alterações').click();
    cy.contains('Produto Editado', { timeout: 10000 }).should('be.visible');
  });
  
  it('deve remover um produto', () => {
    // Primeiro cria um produto novo para remover
    cy.contains('Novo Produto', { timeout: 8000 }).click();
    cy.get('input#name').type('Produto Para Remover');
    cy.get('textarea#description').type('Este produto será removido');
    cy.get('input#price').type('5.99');
    cy.get('input#category').type('Temporário');
    cy.get('input#image').type('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400');
    cy.contains('button', 'Adicionar Produto').click();
    cy.contains('Produto Para Remover', { timeout: 10000 }).should('be.visible');
    
    // Intercepta o diálogo de confirmação antes de clicar no botão
    cy.window().then((win) => {
      cy.stub(win, 'confirm').returns(true);
    });
    
    // Encontra o card do produto e clica no botão Excluir
    cy.contains('Produto Para Remover').closest('[class*="group"]').within(() => {
      cy.get('button[aria-label="Excluir Produto"]').click();
    });
    
    // Aguarda um pouco para a exclusão processar
    cy.wait(500);
    
    // Verifica que o produto não existe mais
    cy.contains('Produto Para Remover').should('not.exist');
  });
});
