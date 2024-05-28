// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('resetUsers', () => {
  cy.request('DELETE', '/auth/reset');
});

Cypress.Commands.add('badRequest', (response, messages = []) => {
  expect(response.status).to.eq(400);
  expect(response.body.error).to.eq('Bad Request');
  messages.forEach((message) => {
    expect(message).to.be.oneOf(response.body.message);
  });
});

Cypress.Commands.add('unauthorized', (response) => {
  expect(response.status).to.eq(401);
  expect(response.body.message).to.eq('Unauthorized');
});

Cypress.Commands.add('checkUnauthorized', (method, url) => {
  cy.request({
    method,
    url,
    headers: {
      authorization: null,
    },
    failOnStatusCode: false,
  }).then((response) => {
    cy.unauthorized(response);
  });
});

Cypress.Commands.add('Login', () => {
  const userData = {
    name: 'John Doe',
    email: 'john2@nest.test',
    password: 'Secret_123',
  };

  cy.resetUsers();

  cy.request({
    method: 'POST',
    url: '/auth/register',
    body: {
      name: userData.name,
      email: userData.email,
      password: userData.password,
    },
  });

  cy.request({
    method: 'POST',
    url: '/auth/login',
    body: {
      email: userData.email,
      password: userData.password,
    },
  }).then((response) => {
    Cypress.env('token', response.body.data.access_token);
  });
});

Cypress.Commands.add('generatePostsData', (count) => {
  const { faker } = require('@faker-js/faker');

  cy.writeFile(
    'cypress/fixtures/posts.json',
    Cypress._.times(count, () => {
      return {
        title: faker.lorem.words(3),
        content: faker.lorem.paragraph(),
      };
    }),
  );
});

Cypress.Commands.add('createPosts', (data = []) => {
  cy.Login();
  /* Reset Post */
  cy.request({
    method: 'DELETE',
    url: '/posts/reset',
    headers: {
      authorization: `Bearer ${Cypress.env('token')}`,
    },
  });

  /* Create Post */
  data.forEach((_post) => {
    cy.request({
      method: 'POST',
      url: '/posts',
      headers: {
        authorization: `Bearer ${Cypress.env('token')}`,
      },
      body: {
        title: _post.title,
        content: _post.content,
      },
    });
  });
});

Cypress.Commands.add('generateCommentsData', (count) => {
  const { faker } = require('@faker-js/faker');

  cy.request({
    method: 'DELETE',
    url: '/comments/reset',
    headers: {
      authorization: `Bearer ${Cypress.env('token')}`,
    },
  });

  cy.generatePostsData(3);
  cy.fixture('posts').then((posts) => cy.createPosts(posts));

  cy.writeFile(
    'cypress/fixtures/comments.json',
    Cypress._.times(count, () => {
      return {
        post_id: faker.datatype.number({ min: 1, max: 3 }),
        content: faker.lorem.words(5),
      };
    }),
  );
});
