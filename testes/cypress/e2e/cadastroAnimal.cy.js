describe("Cadastro de Animal para Adoção", () => {
  // Esse 'beforeEach' roda antes de cada 'it'.
  // Coloquei aqui pra não ter que ficar logando toda hora, já economiza tempo.
  beforeEach(() => {
    // A gente "finge" que o usuário já logou, criando um cookie e salvando os dados dele.
    cy.setCookie("token", "token-fake-para-teste-de-cadastro");
    const usuarioMock = {
      id: "123",
      name: "João da Silva",
      email: "joao.silva@teste.com",
    };
    localStorage.setItem("user", JSON.stringify(usuarioMock));
  });

  it("deve permitir que um usuário logado cadastre um novo pet", () => {
    cy.visit("http://localhost:3000/area_logada/disponibilizar_animal");

    cy.get('input[name="name"]').type("Paçoca");
    cy.get('select[name="type"]').select("Cachorro");
    cy.get('select[name="gender"]').select("Fêmea");
    cy.get('input[name="race"]').type("SRD (Vira-lata)");
    cy.get('textarea[name="description"]').type(
      "Uma cachorrinha muito esperta e brincalhona. Adora correr atrás de bolinhas!"
    );

    // O botão não tem um seletor muito específico, então peguei pelo tipo e texto.
    cy.get('button[type="submit"]').contains("Disponibilizar").click();

    // Conferindo o alerta e se voltamos pra tela certa
    cy.on("window:alert", (texto) => {
      expect(texto).to.equal("Animal cadastrado com sucesso!");
    });
    cy.url().should("include", "/area_logada/meus_animais");
    cy.contains("Meus Animais Disponibilizados").should("be.visible");
  });
});