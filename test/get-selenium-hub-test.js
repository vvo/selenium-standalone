const path = require('path');
const assert = require('assert');
const statusUrl = require('../lib/get-selenium-status-url');

const nodeStatusAPIPath = (isV4) => (isV4 ? '/status' : '/wd/hub/status');
const hubStatusAPIPath = '/grid/api/hub';
describe('getRunningProcessType', () => {
  const tests = [
    // Started as a standalone Selenium Server
    { args: [], expected: statusUrl.PROCESS_TYPES.STANDALONE },
    { args: ['-port', '5555'], expected: statusUrl.PROCESS_TYPES.STANDALONE },
    { args: ['-hub', 'https://foo/wd/register'], expected: statusUrl.PROCESS_TYPES.STANDALONE }, // `-hub` arg is ignored

    // Started as a Selenium Grid hub
    { args: ['-role', 'hub'], expected: statusUrl.PROCESS_TYPES.GRID_HUB },

    // Started as a Selenium Grid node
    { args: ['-role', 'node'], expected: statusUrl.PROCESS_TYPES.GRID_NODE },
    { args: ['-role', 'node', '-hub', 'https://foo/wd/register'], expected: statusUrl.PROCESS_TYPES.GRID_NODE },
  ];

  tests.forEach((test) => {
    it('getRunningProcessType with seleniumArgs: ' + test.args.join(' '), () => {
      const actual = statusUrl.getRunningProcessType(test.args);
      assert.strictEqual(actual, test.expected);
    });
  });
});

describe('getSeleniumStatusUrl', () => {
  const data = [
    // Started as a standalone Selenium Server
    { args: [], expectedUrl: 'localhost:4444' + nodeStatusAPIPath(false) },
    { args: [], expectedUrl: 'localhost:4444' + nodeStatusAPIPath(true), seleniumVersion: '4.0.0-alpha-7' },
    { args: ['-port', '5678'], expectedUrl: 'localhost:5678' + nodeStatusAPIPath(false) },
    { args: ['-hub', 'https://foo/wd/register'], expectedUrl: 'localhost:4444' + nodeStatusAPIPath(false) },
    {
      args: ['-hub', 'https://foo:6666/wd/register', '-port', '7777'],
      expectedUrl: 'localhost:7777' + nodeStatusAPIPath(false),
    },

    // Started as a Selenium Grid hub
    { args: ['-role', 'hub'], expectedUrl: 'localhost:4444' + hubStatusAPIPath },
    { args: ['-role', 'hub', '-port', '12345'], expectedUrl: 'localhost:12345' + hubStatusAPIPath },
    { args: ['-role', 'hub', '-host', 'alias', '-port', '12345'], expectedUrl: 'alias:12345' + hubStatusAPIPath },
    { args: ['-role', 'hub', '-hub', 'https://foo/wd/register'], expectedUrl: 'localhost:4444' + hubStatusAPIPath },
    {
      args: ['-role', 'hub', '-hub', 'https://foo:6666/wd/register', '-port', '12345'],
      expectedUrl: 'localhost:12345' + hubStatusAPIPath,
    },

    // Started as a Selenium Grid node
    { args: ['-role', 'node'], expectedUrl: 'localhost:5555' + nodeStatusAPIPath(false) },
    { args: ['-role', 'node', '-port', '7777'], expectedUrl: 'localhost:7777' + nodeStatusAPIPath(false) },
    {
      args: ['-role', 'node', '-host', 'alias', '-port', '7777'],
      expectedUrl: 'alias:7777' + nodeStatusAPIPath(false),
    },
    {
      args: ['-role', 'node', '-hub', 'https://foo/wd/register'],
      expectedUrl: 'localhost:5555' + nodeStatusAPIPath(false),
    },
    {
      args: ['-role', 'node', '-hub', 'https://foo:6666/wd/register', '-port', '7777'],
      expectedUrl: 'localhost:7777' + nodeStatusAPIPath(false),
    },

    {
      args: ['-role', 'node', '-nodeConfig', path.join(__dirname, 'fixtures', 'config.node.json')],
      expectedUrl: 'foo:123' + nodeStatusAPIPath(false),
    },
    {
      args: ['-role', 'node', '-host', 'alias', '-nodeConfig', path.join(__dirname, 'fixtures', 'config.node.json')],
      expectedUrl: 'alias:123' + nodeStatusAPIPath(false),
    },
    {
      args: [
        '-role',
        'node',
        '-host',
        'alias',
        '-port',
        '7777',
        '-nodeConfig',
        path.join(__dirname, 'fixtures', 'config.node.json'),
      ],
      expectedUrl: 'alias:7777' + nodeStatusAPIPath(false),
    },
  ];
  const testWithData = function (dataItem) {
    return function () {
      const actual = statusUrl.getSeleniumStatusUrl(dataItem.args, { version: dataItem.seleniumVersion || '3.141.59' });
      const expected = 'http://' + dataItem.expectedUrl;

      assert.strictEqual(actual.toString(), expected);
    };
  };

  data.forEach((dataItem) => {
    it('getSeleniumStatusUrl with seleniumArgs: ' + dataItem.args.join(' '), testWithData(dataItem));
  });
});
