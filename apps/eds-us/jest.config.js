export default {
  testEnvironment: 'node',
  transform: {},
  // Exclude mock stubs inside __tests__/__mocks__ from test discovery.
  testPathIgnorePatterns: ['/node_modules/', '__tests__/__mocks__/'],
  moduleNameMapper: {
    // Map absolute /blocks/**/*.js imports (web-component bundles) to an
    // empty stub so the dynamic `await import('/blocks/foo/qsr-foo.js')`
    // calls inside block loadComponent callbacks succeed in Node.js.
    '^/blocks/.+\\.js$': '<rootDir>/__tests__/__mocks__/qsr-component.js',
  },
};
