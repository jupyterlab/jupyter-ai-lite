/**
 * Configuration for Playwright using default from @jupyterlab/galata
 */
const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

module.exports = {
  ...baseConfig,
  use: {
    ...baseConfig.use,
    video: process.env.PWVIDEO || 'retain-on-failure',
    // Do not load the app with `?reset`, otherwise the mocked workspace below
    // is discarded.
    resetWorkspace: false,
    // Mock the workspace to widen the left side panel (where the chat is
    // opened), so that the chat input toolbar fits.
    mockState: {
      'layout-restorer:data': {
        // [left, main, right] areas of the main split panel.
        relativeSizes: [0.35, 0.65, 0]
      }
    },
    launchOptions: {
      slowMo: process.env.PWSLOWMO ? parseInt(process.env.PWSLOWMO) : 0
    }
  },
  webServer: [
    {
      command: 'jlpm start',
      url: 'http://localhost:8888/lab',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'uvicorn mcp-server:app --host 0.0.0.0 --port 8765',
      url: 'http://localhost:8765/health',
      timeout: 30 * 1000,
      reuseExistingServer: !process.env.CI,
      cwd: __dirname
    }
  ]
};
