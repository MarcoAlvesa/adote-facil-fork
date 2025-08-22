// mudei o nome do arquivo pra algo mais geral, já que vamos testar mais do que só o sucesso
describe("Fluxo de Cadastro e Login de Usuário", () => {
  it("deve cadastrar um novo usuário com sucesso e depois logar na conta", () => {
    cy.visit("http://localhost:3000/cadastro");

    // Dados de uma usuária fictícia
    const nomeUsuario = "Carla Mendes";
    const emailUsuario = `carla.mendes${Date.now()}@teste.com`; // Adiciona timestamp pra garantir que o email é sempre único

    cy.get('input[name="name"]').type(nomeUsuario);
    cy.get('input[name="email"]').type(emailUsuario);
    cy.get('input[name="password"]').type("senhaSegura123");
    cy.get('input[name="confirmPassword"]').type("senhaSegura123");
    cy.get('button[type="submit"]').click();

    // Conferindo se o alerta de sucesso apareceu e se fomos pra tela de login
    cy.on("window:alert", (texto) => {
      expect(texto).to.equal(
        "Cadastro efetuado com sucesso! Faça login para acessar nossa plataforma!"
      );
    });
    cy.url().should("include", "/login");

    // Agora, a parte do login com a mesma conta
    cy.get('input[name="email"]').type(emailUsuario);
    cy.get('input[name="password"]').type("senhaSegura123");
    cy.get('button[type="submit"]').click();

    // Se tudo deu certo, devemos estar na área logada
    cy.url().should("include", "/area_logada/animais_disponiveis");
    cy.contains("Animais Disponíveis").should("be.visible");
  });

  it("deve mostrar um erro ao tentar cadastrar com senhas diferentes", () => {
    cy.visit("http://localhost:3000/cadastro");

    cy.get('input[name="name"]').type("Mariana Lima");
    cy.get('input[name="email"]').type(`mari.lima${Date.now()}@teste.com`);
    cy.get('input[name="password"]').type("senha123");
    cy.get('input[name="confirmPassword"]').type("outraSenha456"); // Senha errada de propósito
    cy.get('button[type="submit"]').click();

    // A verificação de erro pode variar, mas geralmente o site mostra uma mensagem
    // ou impede o envio. Vamos checar se continuamos na mesma página.
    cy.url().should("include", "/cadastro");
    // Idealmente, a gente checaria uma mensagem de erro específica.
    // cy.get('.mensagem-de-erro').should('contain', 'As senhas não conferem');
  });
});