describe('Post Module', () => {
  const dataCount = 15;
  const randomId = Cypress._.random(16, 50);

  before('Do Login', () => {
    cy.Login();
  });

  before('generate posts data', () => cy.generatePostsData(dataCount));

  describe('Create Post', () => {
    /* Return Unauthorized */
    it('Should return unauthorized', () => {
      cy.checkUnauthorized('POST', '/posts');
    });

    /* Return Error Validation Messages */
    it('Should return error validation messages', () => {
      cy.request({
        method: 'POST',
        url: '/posts',
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.badRequest(response, [
          'title must be a string',
          'content must be a string',
        ]);
      });
    });

    /* Return Correct Post */
    it('Should return correct post', () => {
      cy.fixture('posts').then((postData) => {
        cy.request({
          method: 'POST',
          url: '/posts',
          headers: {
            authorization: `Bearer ${Cypress.env('token')}`,
          },
          body: {
            title: postData[0].title,
            content: postData[0].content,
          },
        }).then((response) => {
          const {
            success,
            data: { title, content, comments },
          } = response.body;
          expect(response.status).to.eq(201);
          expect(success).to.be.true;
          expect(title).to.eq(postData[0].title);
          expect(content).to.eq(postData[0].content);
          expect(comments.length).to.eq(0);
        });
      });
    });
  });

  describe('Get All Post', () => {
    /* Check Authorization */
    it('Should Return Unauthorized', () => {
      cy.checkUnauthorized('GET', '/posts');
    });

    /* Return Correct Count and Data */
    it('Should Return Correct Count and Data', () => {
      cy.fixture('posts').then((postData) => {
        /* Reset Post */
        cy.createPosts(postData);
        /* Get All Data */
        cy.request({
          method: 'GET',
          url: '/posts',
          headers: {
            authorization: `Bearer ${Cypress.env('token')}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.be.true;
          expect(response.body.data.length).to.eq(postData.length);

          postData.forEach((_post, index) => {
            expect(response.body.data[index].id).to.eq(index + 1);
            expect(response.body.data[index].title).to.eq(_post.title);
            expect(response.body.data[index].content).to.eq(_post.content);
          });
        });
      });
    });
  });

  describe('Get By ID', () => {
    /* Check Unauthorized */
    it('Should Return Unauthorized', () => {
      cy.checkUnauthorized('GET', '/posts/1');
    });

    /* Return Correct Data */
    it('Should Return Correct Data', () => {
      cy.fixture('posts').then((postsData) => {
        postsData.forEach((_post, index) => {
          cy.request({
            method: 'GET',
            url: `/posts/${index + 1}`,
            headers: {
              authorization: `Bearer ${Cypress.env('token')}`,
            },
          }).then((response) => {
            const { title, content } = response.body.data;
            expect(response.status).to.be.ok;
            expect(title).to.eq(_post.title);
            expect(content).to.eq(_post.content);
          });
        });
      });
    });

    /* Return Not Found */
    it('Should Return Not Found', () => {
      cy.request({
        method: 'GET',
        url: `/posts/${randomId}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.success).to.be.false;
        expect(response.body.data).to.be.null;
      });
    });
  });

  describe('Update Post', () => {
    /* Check Unauthorized */
    it('Should Return Unauthorized', () => {
      cy.checkUnauthorized('PATCH', '/posts/1');
    });

    /* Return Not Found */
    it('Should Return Not Found', () => {
      cy.request({
        method: 'PATCH',
        url: `/posts/${randomId}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.success).to.be.false;
        expect(response.body.data).to.be.null;
      });
    });

    /* Return Error Validation */
    it('Should Return Error Validation Messages', () => {
      cy.request({
        method: 'PATCH',
        url: `/posts/1`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
        body: {
          title: false,
          content: randomId,
        },
      }).then((response) => {
        cy.badRequest(response, [
          'title must be a string',
          'content must be a string',
        ]);
      });
    });

    /* Return Correct Updated Post */
    it('Should Return Correct Updated Post', () => {
      const updatedPost = {
        id: 1,
        title: 'Updated Title',
        content: 'Updated Content',
      };

      cy.request({
        method: 'PATCH',
        url: `/posts/${updatedPost.id}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        body: {
          title: updatedPost.title,
          content: updatedPost.content,
        },
      }).then((response) => {
        const {
          success,
          data: { title, content },
        } = response.body;
        expect(response.status).to.eq(200);
        expect(success).to.be.true;
        expect(title).to.eq(updatedPost.title);
        expect(content).to.eq(updatedPost.content);
      });

      cy.request({
        method: 'GET',
        url: `/posts/${updatedPost.id}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
      }).then((response) => {
        const { title, content } = response.body.data;
        expect(response.status).to.be.ok;
        expect(title).to.eq(updatedPost.title);
        expect(content).to.eq(updatedPost.content);
      });

      cy.request({
        method: 'GET',
        url: '/posts',
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
      }).then((response) => {
        const post = response.body.data.find(
          (_post) => _post.id === updatedPost.id,
        );

        expect(post.title).to.eq(updatedPost.title);
        expect(post.content).to.eq(updatedPost.content);
      });
    });
  });

  describe('Delete Post', () => {
    /* Check Unauthorized */
    it('Should Return Unauthorized', () => {
      cy.checkUnauthorized('DELETE', '/posts/1');
    });

    /* Return Not Found */
    it('Should Return Not Found', () => {
      cy.request({
        method: 'DELETE',
        url: `/posts/${randomId}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.success).to.be.false;
        expect(response.body.data).to.be.null;
      });
    });

    /* Check Successfully Remove the Post */
    it('Should Successfully remove the post', () => {
      cy.request({
        method: 'DELETE',
        url: `/posts/1`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
      }).then((response) => {
        expect(response.status).to.be.ok;
        expect(response.body.success).to.be.true;
        expect(response.body.message).to.eq('Post deleted successfully');
      });
    });

    /* Not be Found the Delete Post */
    it('Should not be found the deleted post', () => {
      cy.request({
        method: 'GET',
        url: `/posts/1`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
      });

      cy.request({
        method: 'GET',
        url: '/posts',
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        const post = response.body.data.find((_post) => _post.id === 1);

        expect(post).to.be.undefined;
      });
    });
  });
});
