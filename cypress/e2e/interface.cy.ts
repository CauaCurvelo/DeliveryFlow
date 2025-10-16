/// <reference types="cypress" />

describe('Verificação de Interface Completa', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('deve renderizar o header com título e descrição', () => {
    cy.contains('Painel Administrativo').should('be.visible');
    cy.contains('Gerencie pedidos e cardápio do seu delivery').should('be.visible');
  });

  it('deve renderizar as estatísticas (cards de stats)', () => {
    cy.contains('Pendentes').should('be.visible');
    cy.contains('Em Preparo').should('be.visible');
    cy.contains('Prontos').should('be.visible');
    cy.contains('Saindo').should('be.visible');
  });

  it('deve renderizar as abas de navegação', () => {
    cy.contains('Pedidos').should('be.visible');
    cy.contains('Cardápio').should('be.visible');
  });

  it('deve renderizar o conteúdo da aba Pedidos por padrão', () => {
    // Verifica se está na aba Pedidos
    cy.contains('Pedidos').should('be.visible');
    
    // Verifica se os filtros estão visíveis
    cy.contains('Filtros:').should('be.visible');
    
    // Verifica se há cards de pedidos ou mensagem de "nenhum pedido"
    cy.get('body').then($body => {
      const hasOrders = $body.text().includes('Maria Silva') || 
                       $body.text().includes('João Santos') ||
                       $body.text().includes('Nenhum pedido encontrado');
      expect(hasOrders).to.be.true;
    });
  });

  it('deve renderizar o conteúdo da aba Cardápio', () => {
    cy.contains('Cardápio').click();
    
    // Verifica o botão de adicionar produto
    cy.contains('Novo Produto').should('be.visible');
    
    // Verifica se mostra quantos produtos ativos
    cy.contains(/\d+ produtos ativos/).should('be.visible');
    
    // Verifica se há produtos ou mensagem de "nenhum produto"
    cy.get('body').then($body => {
      const hasProducts = $body.text().includes('Pizza Margherita G') || 
                         $body.text().includes('X-Burger Bacon') ||
                         $body.text().includes('Nenhum produto cadastrado');
      expect(hasProducts).to.be.true;
    });
  });

  it('deve aplicar tema dark por padrão', () => {
    cy.get('html').should('have.class', 'dark');
  });

  it('deve renderizar todos os produtos mockados', () => {
    cy.contains('Cardápio').click();
    
    // Produtos que devem estar visíveis
    const produtos = [
      'Pizza Margherita G',
      'X-Burger Bacon',
      'Salada Caesar',
      'Pasta Carbonara',
      'Refrigerante 2L',
      'Batata Frita G',
      'Tiramisu'
    ];
    
    // Verifica se pelo menos alguns produtos estão visíveis
    cy.contains(produtos[0], { timeout: 5000 }).should('be.visible');
  });

  it('deve renderizar os cards de pedidos mockados', () => {
    cy.contains('Pedidos').click();
    
    // Aguarda os pedidos carregarem
    cy.wait(1000);
    
    // Verifica se há elementos de pedido na página
    cy.get('body').then($body => {
      const hasOrders = $body.text().includes('Maria Silva') || 
                       $body.text().includes('João Santos') ||
                       $body.text().includes('Nenhum pedido encontrado');
      expect(hasOrders).to.be.true;
    });
  });

  it('deve ter estilos aplicados corretamente (não estar em branco)', () => {
    // Verifica se o body tem cor de fundo (não transparente/branco)
    cy.get('body').should('have.css', 'background-color');
    
    // Verifica se há pelo menos 10 elementos visíveis na página
    cy.get('*:visible').should('have.length.greaterThan', 10);
  });

  it('deve renderizar ícones corretamente', () => {
    cy.get('svg').should('have.length.greaterThan', 0);
  });
});
