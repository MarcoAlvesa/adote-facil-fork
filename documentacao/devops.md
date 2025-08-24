# DevOps no Projeto Adote Fácil

O projeto conta com pipeline CI/CD, com 4 jobs:
  1. unit=test: checkout do código, instala dependências e realiza testes unitários com jest.
  2. build: constrói imagens Docker.
  3. up-containers: cria as variáveis do banco de dados e sobe os containers do projeto.
  4. delivery: gerá artefato com o código-fonte em um arquivo zip

Os testes automatizados são somentes os unitários e faz o uso de containers.

### Melhorias:

Após a implementação dos testes em cypress, agora é possível que o pipeline os execute de forma automatica. Para isso é utilizado a ferramneta de automação do Cypress [cypress-90/github-action](https://github.com/cypress-io/github-action?tab=readme-ov-file#component-testing). Usamos o workflow End-to-End Testing, que faz todos os testes criados para o projeto, que se encontra no diretório 'testes/cypress/e2e'. Foi adicionado no yml o seguinte trecho, dentro de up-containers:

```yml
      - name: Executar testes E2E com Cypress
        uses: cypress-io/github-action@v6
        with:
          working-directory: ./testes
          wait-on: 'http://localhost:3000'
          wait-on-timeout: 180
          browser: chrome
```

E agora, o job delivery depende de up containers.

O Dockerfile e docker-compose.yml não foram alterados.