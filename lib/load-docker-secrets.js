'use strict';

// I've taken this from
// https://github.com/cloudreach/node-docker-secrets
// and modified it so that it does not read from IO
// during the require statement but rather exports
// a function which can be invoked at an appropriate time.

const fs = require('fs');
const path = require('path');

module.exports = {
  load({ secretsDir = '/run/secrets' } = {}) {
    if (fs.existsSync(secretsDir)) {
      const files = fs.readdirSync(secretsDir);

      return files.reduce((output, file) => {
        const fullPath = path.join(secretsDir, file);
        const key = file;
        const data = fs.readFileSync(fullPath, 'utf8').toString().trim();

        // eslint-disable-next-line no-param-reassign
        output[key] = data;
        return output;
      }, {});
    }

    return {};
  },
};
