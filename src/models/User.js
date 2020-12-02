import bookshelf from '../config';

const User = bookshelf.model('User', {
  tableName: 'users',
  
  rooms() {
    return this.belongsToMany('Room')
  },
  consumer(){
    return this.belongsTo('Consumer')
  }
});

export default User;
