const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'chat',
    charset: 'utf8',
  },
});

const bookshelf = require('bookshelf')(knex);

export default bookshelf;
