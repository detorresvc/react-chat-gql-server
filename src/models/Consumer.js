import bookshelf  from '../config';

const Consumer = bookshelf.model('Consumer', {
  tableName: 'consumers',
  hasTimestamps: true,
  users(){
    return this.hasMany('User')
  }
});

export default Consumer;
