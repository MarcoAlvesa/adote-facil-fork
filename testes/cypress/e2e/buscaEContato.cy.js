describe("Busca por um Pet e Início de Contato", () => {
  beforeEach(() => {
    // Simulando o login de um *outro* usuário, interessado em adotar.
    cy.setCookie("token", "token-fake-para-teste-de-busca");
    const adotanteMock = {
      id: "456",
      name: "Maria Oliveira",
      email: "maria.oliveira@teste.com",
    };
    localStorage.setItem("user", JSON.stringify(adotanteMock));
  });

  it("deve permitir que o usuário filtre por um animal e entre em contato com o dono", () => {
    // Para este teste funcionar, o animal 'Paçoca' precisa existir.
    // Em um cenário mais avançado, a gente cadastraria ele via API antes do teste rodar.
    // Por enquanto, vamos assumir que ele está lá.
    cy.visit("http://localhost:3000/area_logada/animais_disponiveis");

    // Abrindo os filtros e buscando pelo nome
    cy.get("button").contains("Filtrar").click();
    cy.get('input[name="name"]').type("Paçoca");
    cy.get('button[type="submit"]').click();

    // O card do animal deve aparecer. Vamos clicar nele.
    cy.contains("Paçoca").click();

    // Agora na página de detalhes, vamos iniciar a conversa.
    cy.url().should("include", "/area_logada/animais_disponiveis/"); // Checa se a URL mudou pra de detalhes
    cy.get("button").contains("Entrar em contato com o dono").click();

    // O passo final é chegar na tela de chat.
    cy.url().should("include", "/area_logada/conversas/");
    cy.contains("Conversas").should("be.visible");
  });
});