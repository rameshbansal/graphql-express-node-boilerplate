import USER_ACTIONS from './user.actions';
import FILES_ACTIONS from './files.actions';

module.exports = {
  ...USER_ACTIONS,
  ...FILES_ACTIONS,
};

