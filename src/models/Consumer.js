import bookshelf  from '../config';

const Consumer = bookshelf.model('Consumer', {
  tableName: 'consumers',
});

export default Consumer;
