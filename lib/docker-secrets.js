'use strict';

const nconf = require('nconf');
const _ = require('lodash');

const { load: loadSecrets } = require('./load-docker-secrets');
const { name } = require('../package.json');

const logMessage = (level, message) => {
  // We are already sync here and I have no longer logging options
  // eslint-disable-next-line no-console
  console[level](`${name}::${message}`);
};

const toLower = (dockerSecrets, toLowerCase) => (
  toLowerCase
    ? Object.entries(dockerSecrets)
      .reduce((acc, [key, value]) => {
        acc[key.toLowerCase()] = value;
        return acc;
      }, {})
    : dockerSecrets
);

function parseNestedKeys(dockerSecrets) {
  return this.parseValues
    ? Object.entries(dockerSecrets)
      .reduce((acc, [key, value]) => {
        const pathParts = key.split(this.logicalSeparator);

        _.set(acc, pathParts, value);
        return acc;
      }, {})
    : dockerSecrets;
}

class Dockersecrets extends nconf.Memory {

  constructor(options = {}) {
    super();
    this.readOnly = true;
    this.type = 'dockersecrets';
    this.lowerCase = options.lowerCase || false;
    this.logicalSeparator = options.logicalSeparator || ':';
    this.parseValues = options.parseValues || false;
    this.secretsDir = options.secretsDir;

    let secrets;
    try {
      secrets = loadSecrets(this.secretsDir);
    } catch (err) {
      secrets = {};
      logMessage('error', `Failed to load secrets: ${err.message}`);
    }

    this.store = parseNestedKeys.call(this, toLower(secrets, this.lowerCase));
  }

  // @returns an Object with all the key-values associated in this instance
  load(callback) {
    try {
      const secrets = loadSecrets(this.secretsDir);
      this.store = parseNestedKeys.call(this, toLower(secrets, this.lowerCase));
      callback(null, this.store);
    } catch (err) {
      callback(err);
    }
  }
}

//
// Insert Dockersecrets plugin into nconf so that it can be using by .use('dockersecrets', options)
//
nconf.Dockersecrets = Dockersecrets;

module.exports = {
  Dockersecrets,
};
