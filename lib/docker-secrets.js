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

const getToLower = toLowerCase => dockerSecrets => (
  toLowerCase
    ? Object.entries(dockerSecrets)
      .reduce((acc, [key, value]) => {
        acc[key.toLowerCase()] = value;
        return acc;
      }, {})
    : dockerSecrets
);

const getParseValues = shouldParse => dockerSecrets => (
  shouldParse
    ? Object.entries(dockerSecrets)
      .reduce((acc, [key, value]) => {
        let val = value;

        try {
          val = JSON.parse(value);
        } catch (ignore) {
          // Check for any other well-known strings that should be "parsed"
          if (value === 'undefined') {
            val = undefined;
          }
        }

        acc[key] = val;
        return acc;
      }, {})
    : dockerSecrets
);

const getParseNestedKeys = separator => dockerSecrets => (
  separator
    ? Object.entries(dockerSecrets)
        .reduce((acc, [key, value]) => {
          const pathParts = key.split(separator);

          _.set(acc, pathParts, value);
          return acc;
        }, {})
    : dockerSecrets
);

class Dockersecrets extends nconf.Memory {

  constructor(options = {}) {
    super();
    this.readOnly = true;
    this.type = 'dockersecrets';
    this.lowerCase = options.lowerCase || false;
    this.parseValues = options.parseValues || false;
    this.secretsDir = options.secretsDir;
    this.separator = options.separator;

    let secrets;
    try {
      secrets = loadSecrets(this.secretsDir);
    } catch (err) {
      secrets = {};
      logMessage('error', `Failed to load secrets: ${err.message}`);
    }

    const parseNestedKeys = getParseNestedKeys(this.separator);
    const parseValues = getParseValues(this.parseValues);
    const toLower = getToLower(this.lowerCase);

    this.store = parseNestedKeys(parseValues(toLower(secrets)));
  }

  get logicalSeparator() {
    // To avoid having to overload the get method make the separator property also accessible via
    // the logicalSeparator property as this reference is used by nconf.Memory.prototype.get
    return this.separator;
  }

  // @returns an Object with all the key-values associated in this instance
  load(callback) {
    try {
      const secrets = loadSecrets(this.secretsDir);
      const parseNestedKeys = getParseNestedKeys(this.separator);
      const parseValues = getParseValues(this.parseValues);
      const toLower = getToLower(this.lowerCase);

      this.store = parseNestedKeys(parseValues(toLower(secrets)));

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
