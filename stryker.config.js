/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.js',
  },
  mutate: [
    'src/**/*.js',
    '!src/data/**/*.js', // data files are config, not logic
    '!src/config.js',    // pure configuration values
    '!src/input.js',     // DOM/touch event handling, tested via integration
    '!src/renderer.js',  // pure Canvas 2D drawing, tested visually
    '!src/game.js',      // orchestration with Canvas dependency, tested via game.test.js for logic
  ],
  thresholds: {
    high: 80,
    low: 60,
    break: 45, // CI fails if mutation score drops below 45%
  },
  reporters: ['clear-text', 'html', 'progress'],
  htmlReporter: {
    fileName: 'reports/mutation.html',
  },
  concurrency: 2,
  timeoutMS: 10000,
};
