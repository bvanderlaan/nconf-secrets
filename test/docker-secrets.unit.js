'use strict';

const fs = require('fs');

const chai = require('chai');
// const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');

const { Dockersecrets } = require('../lib/docker-secrets');

const { expect } = chai;
// chai.use(chaiAsPromised);

describe('Dockersecrets :: Unit ::', () => {
  describe('Properties', () => {
    before('stub load-docker-secrets', () => {
      sinon.stub(fs, 'existsSync').returns(false);
    });
    after(() => fs.existsSync.restore());

    it('should have a type of Dockersecrets', () => {
      const plugin = new Dockersecrets();
      expect(plugin).to.have.property('type', 'dockersecrets');
    });

    it('should be readonly', () => {
      const plugin = new Dockersecrets();
      expect(plugin).to.have.property('readOnly', true);
    });
  });

  describe('Options', () => {
    before('stub load-docker-secrets', () => {
      sinon.stub(fs, 'existsSync').returns(false);
    });
    after(() => fs.existsSync.restore());

    it('should default to not lower case', () => {
      const plugin = new Dockersecrets();
      expect(plugin).to.have.property('lowerCase', false);
    });

    it('should allow option to enable lower case', () => {
      const plugin = new Dockersecrets({ lowerCase: true });
      expect(plugin).to.have.property('lowerCase', true);
    });

    it('should default the logical separator to :', () => {
      const plugin = new Dockersecrets();
      expect(plugin).to.have.property('logicalSeparator', ':');
    });

    it('should allow option to override logical separator', () => {
      const plugin = new Dockersecrets({ logicalSeparator: '__' });
      expect(plugin).to.have.property('logicalSeparator', '__');
    });

    it('should default to not parsing nested values', () => {
      const plugin = new Dockersecrets();
      expect(plugin).to.have.property('parseValues', false);
    });

    it('should allow option to enable parsing of nested values', () => {
      const plugin = new Dockersecrets({ parseValues: true });
      expect(plugin).to.have.property('parseValues', true);
    });
  });

  describe('Load from Constructor when secrets do not exist', () => {
    before('stub load-docker-secrets', () => {
      sinon.stub(fs, 'existsSync').returns(false);
    });
    after(() => fs.existsSync.restore());

    it('should have an empty store', () => {
      const plugin = new Dockersecrets();
      expect(plugin).to.have.property('store')
        .which.deep.equals({});
    });
  });

  describe('Load from Constructor', () => {
    before('stub load-docker-secrets', () => {
      sinon.stub(fs, 'existsSync').returns(true);
      sinon.stub(fs, 'readdirSync').returns([
        'MY_SECRET',
        'MY__NESTED__SECRET',
        'MY:OTHER:NESTED:SECRET',
      ]);
      sinon.stub(fs, 'readFileSync').returns('hello world');
    });
    after(() => {
      fs.existsSync.restore();
      fs.readdirSync.restore();
      fs.readFileSync.restore();
    });

    describe('with default options', () => {
      it('should not convert to lower case or parse nested values', () => {
        const plugin = new Dockersecrets();
        expect(plugin.store).to.deep.equals({
          MY_SECRET: 'hello world',
          MY__NESTED__SECRET: 'hello world',
          'MY:OTHER:NESTED:SECRET': 'hello world',
        });
      });
    });

    describe('with lower case options', () => {
      it('should convert to lower case', () => {
        const plugin = new Dockersecrets({ lowerCase: true });
        expect(plugin.store).to.deep.equals({
          my_secret: 'hello world',
          my__nested__secret: 'hello world',
          'my:other:nested:secret': 'hello world',
        });
      });
    });

    describe('with parse nested values options', () => {
      it('should parse out nested values with default separator', () => {
        const plugin = new Dockersecrets({ parseValues: true });
        expect(plugin.store).to.deep.equals({
          MY_SECRET: 'hello world',
          MY__NESTED__SECRET: 'hello world',
          MY: {
            OTHER: {
              NESTED: {
                SECRET: 'hello world',
              },
            },
          },
        });
      });
    });

    describe('with custom separator options', () => {
      it('should parse out nested values with custom separator', () => {
        const plugin = new Dockersecrets({ parseValues: true, logicalSeparator: '__' });
        expect(plugin.store).to.deep.equals({
          MY_SECRET: 'hello world',
          MY: {
            NESTED: {
              SECRET: 'hello world',
            },
          },
          'MY:OTHER:NESTED:SECRET': 'hello world',
        });
      });
    });
  });

  describe('Load', () => {
    let plugin;
    before('stub load-docker-secrets', () => {
      sinon.stub(fs, 'existsSync').returns(false);
      plugin = new Dockersecrets({
        lowerCase: true,
      });
      expect(plugin).to.have.property('store')
        .which.deep.equals({});
    });
    after(() => fs.existsSync.restore());

    describe('when reloading store', () => {
      before('stub load-docker-secrets', () => {
        fs.existsSync.returns(true);
        sinon.stub(fs, 'readdirSync').returns([
          'MY_SECRET',
          'MY__NESTED__SECRET',
          'MY:OTHER:NESTED:SECRET',
        ]);
        sinon.stub(fs, 'readFileSync').returns('hello world');
      });
      after(() => {
        fs.readdirSync.restore();
        fs.readFileSync.restore();
      });

      it('should re-populate the store', (done) => {
        plugin.load((err, store) => {
          if (err) done(err);

          expect(store).to.deep.equals({
            my_secret: 'hello world',
            my__nested__secret: 'hello world',
            'my:other:nested:secret': 'hello world',
          });

          expect(plugin.store).to.deep.equals({
            my_secret: 'hello world',
            my__nested__secret: 'hello world',
            'my:other:nested:secret': 'hello world',
          });

          done();
        });
      });
    });

    describe('when failed to read secrets', () => {
      before('stub load-docker-secrets', () => {
        fs.existsSync.returns(true);
        sinon.stub(fs, 'readdirSync').throws(new Error('boom'));
      });
      after(() => fs.readdirSync.restore());

      it('should re-populate the store', (done) => {
        plugin.load((err) => {
          expect(err).to.be.an('Error')
            .with.property('message', 'boom');

          done();
        });
      });
    });
  });

  describe('Get', () => {
    let plugin;

    before('stub load-docker-secrets', () => {
      sinon.stub(fs, 'existsSync').returns(true);
      sinon.stub(fs, 'readdirSync').returns([
        'MY_SECRET',
        'MY__NESTED__SECRET',
        'MY:OTHER:NESTED:SECRET',
      ]);
      sinon.stub(fs, 'readFileSync').returns('hello world');

      plugin = new Dockersecrets({
        lowerCase: true,
        parseValues: true,
        logicalSeparator: '__',
      });
    });
    after(() => {
      fs.existsSync.restore();
      fs.readdirSync.restore();
      fs.readFileSync.restore();
    });

    it('should get a value', () => {
      expect(plugin.get('my_secret'))
        .to.equal('hello world');

      expect(plugin.get('my:other:nested:secret'))
        .to.equal('hello world');
    });

    it('should not get value if wrong case', () => {
      expect(plugin.get('MY_SECRET'))
        .to.be.undefined;
    });

    it('should get a nested value', () => {
      expect(plugin.get('my__nested__secret'))
        .to.equal('hello world');
    });

    it('should not get a nested value with wrong separators', () => {
      expect(plugin.get('my:nested:secret'))
        .to.be.undefined;
    });

    it('should get nested value as an object', () => {
      expect(plugin.get('my'))
        .to.deep.equals({
          nested: {
            secret: 'hello world',
          },
        });
    });
  });
});
