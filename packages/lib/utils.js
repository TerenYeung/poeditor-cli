const
  fs = require('fs');

function isExist(url) {
  return fs.existsSync(url);
}

module.exports = {
  isExist
}