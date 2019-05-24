# nconf-secrets

nconf-secrets is a storage extension that support loading docker swarm secrets.

## How to use it

```javascript
'use strict';

const nconf = require('nconf');

require('@vanderlaan/nconf-secrets');

nconf.argv()
  .env('__')
  .use('dockersecrets', { lowerCase: true, logicalSeparator: '__' });

console.log(nconf.get('http__shared_secret'));
```

### Tell nconf-config where to find secrets

For example docker swarm will place secrets on the container at a given path.
`nconf-secrets` will look at the default path used by docker swarm however if you configured your swarm to use a different path for secrets you can pass said path into `nconf-secrets` through the `secretsDir` option.

```javascript
'use strict';

const nconf = require('nconf');

require('@vanderlaan/nconf-secrets');

nconf.argv()
  .env('__')
  .use('dockersecrets', {
    lowerCase: true,
    logicalSeparator: '__',
    secretsDir: '/my/secrets/path',
  });

console.log(nconf.get('http__shared_secret'));
```

## Description

After requiring `nconf-secrets` its storage will automagically be registered to `nconf`.

`nconf-secrets` supports a number of optional parameters:
|Parameter|Description|
|:--------|:----------|
|lowerCase|Converts the secret keys to lower case. Default `false`|
|logicalSeparator|Defines what the character nconf-secrets should use to denote a nested value. Default `:`|
|secretsDir|The path to the secrets directory. Default to Docker Swarm default location|

## Development

### Running Tests

`nconf-secrets` has a full test suite to ensure proper behaviours. To run them just use:
```
npm test
```
This will output the tests results as well as the code coverage. The code coverage is also reported as an HTML document found under the `./reports` folder.

### Style Guide

[The JavaScript Style Guide](https://www.npmjs.com/package/@vanderlaan/eslint-config-vanderlaan) is used for this project so you must comply to that rule set. You can verify your changes are in compliance via the `npm run lint` command.

### Contributing

Bug reports and pull requests are welcome. To ensure your contributions are accepted please read and oblige by our [Contribution Guide](.github/CONTRIBUTING.md).
This project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to the [Contributor Covenant](.github/CODE_OF_CONDUCT.md) code of conduct.


## Special Thanks

The idea for this plugin came from [Gallo Feliz](https://github.com/indexzero/nconf/issues/303).
How to read the docker secrets came from [node-docker-secrets](https://github.com/cloudreach/node-docker-secrets)
