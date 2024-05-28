describe('Auth Module', () => {
  const userData = {
    name: 'John Doe',
    email: 'john2@nest.test',
    password: 'Secret_123',
  };

  describe('Register', () => {
    /* Error validation (null name, email, and password) */
    it('should return error message for validation', () => {
      cy.request({
        method: 'POST',
        url: 'auth/register',
        failOnStatusCode: false,
      }).then((response) => {
        // expect(response.status).to.eq(400);
        // expect(response.body.error).to.eq('Bad Request');
        // expect('name should not be empty').to.be.oneOf(response.body.message);
        // expect('email should not be empty').to.be.oneOf(response.body.message);
        // expect('password should not be empty').to.be.oneOf(
        //   response.body.message,
        // );
        cy.badRequest(response, [
          'name should not be empty',
          'email should not be empty',
          'password should not be empty',
        ]);
      });
    });

    /* Error validation invalid format email */
    it('should return error message for invalid email format', () => {
      cy.request({
        method: 'POST',
        url: '/auth/register',
        body: {
          name: 'John Doe',
          email: 'john @ nest.test',
          password: 'Secret_123',
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.log(response);
        expect(response.status).to.eq(400);
        expect(response.body.error).to.eq('Bad Request');
        expect('email must be an email').to.be.oneOf(response.body.message);
      });
    });

    /* Error validation invalid password */
    it('should return error message for invalid password', () => {
      cy.request({
        method: 'POST',
        url: '/auth/register',
        body: {
          name: 'John Doe',
          email: 'john@nest.test',
          password: 'invalidpassword',
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.log(response);
        expect(response.status).to.eq(400);
        expect(response.body.error).to.eq('Bad Request');
        expect('password is not strong enough').to.be.oneOf(
          response.body.message,
        );
      });
    });

    /* Register Successfully */
    it('should successfully registered', () => {
      cy.resetUsers();
      cy.request({
        method: 'POST',
        url: '/auth/register',
        body: {
          name: userData.name,
          email: userData.email,
          password: userData.password,
        },
      }).then((response) => {
        const { id, name, email, password } = response.body.data;
        expect(response.status).to.eq(201);
        expect(response.body.success).to.be.true;
        expect(id).not.to.be.undefined;
        expect(name).to.eq('John Doe');
        expect(email).to.eq('john2@nest.test');
        expect(password).to.be.undefined;
      });
    });

    /* Error Duplicate Entry */
    it('should return error because of duplicate email', () => {
      cy.request({
        method: 'POST',
        url: '/auth/register',
        body: {
          name: 'John Doe',
          email: 'john2@nest.test',
          password: 'Secret_123',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(500);
        expect(response.body.success).to.be.false;
        expect(response.body.message).to.eq('Email already exists');
      });
    });
  });

  describe('Login', () => {
    /* Unauthorized */
    it('Should return unauthorized on failed', () => {
      cy.request({
        method: 'POST',
        url: '/auth/login',
        failOnStatusCode: false,
      }).then((response) => {
        cy.unauthorized(response);
      });

      cy.request({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: userData.email,
          password: 'wrongpassword',
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.unauthorized(response);
      });
    });

    /* Success */
    it('Should return access token on success', () => {
      cy.request({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: userData.email,
          password: userData.password,
        },
      }).then((response) => {
        expect(response.body.success).to.be.true;
        expect(response.body.message).to.eq('Login success');
        expect(response.body.data.access_token).not.to.be.undefined;
      });
    });
  });

  describe('Me', () => {
    before('do login', () => {
      cy.Login();
    });

    /* Error Unauthorized */
    it('Should return unauthorized when send no token', () => {
      cy.checkUnauthorized('GET', '/auth/me');
    });
    /* Return Correct Current Data */
    it('Should return correct current data', () => {
      cy.request({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        const { id, name, email, password } = response.body.data;
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true;
        expect(id).not.to.be.undefined;
        expect(name).to.eq(userData.name);
        expect(email).to.eq(userData.email);
        expect(password).to.be.undefined;
      });
    });
  });
});
