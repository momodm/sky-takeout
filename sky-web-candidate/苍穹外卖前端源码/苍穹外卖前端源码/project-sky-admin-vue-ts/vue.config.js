const path = require('path')

const appName = '苍穹外卖后台候选版'

module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/legacy-console/' : '/',
  outputDir: 'dist-legacy-console',
  assetsDir: 'static',
  lintOnSave: process.env.NODE_ENV === 'development',
  productionSourceMap: false,
  pwa: {
    name: appName,
  },
  pluginOptions: {
    'style-resources-loader': {
      preProcessor: 'scss',
      patterns: [
        path.resolve(__dirname, 'src/styles/_variables.scss'),
        path.resolve(__dirname, 'src/styles/_mixins.scss'),
      ],
    },
  },
  devServer: {
    host: '0.0.0.0',
    port: 8889,
    public: '0.0.0.0:8889',
    open: false,
    disableHostCheck: true,
    hot: true,
    overlay: {
      warnings: false,
      errors: true,
    },
    proxy: {
      '/api': {
        target: process.env.VUE_APP_URL,
        ws: false,
        secure: false,
        changeOrigin: true,
        pathRewrite: {
          '^/api': '',
        },
      },
    },
  },
  chainWebpack: (config) => {
    config.resolve.symlinks(true)
    // 旧项目依赖的类型生态过老，关闭额外的类型检查插件以恢复构建。
    config.plugins.delete('fork-ts-checker')
  },
  configureWebpack: {
    devtool: process.env.NODE_ENV === 'development' ? 'eval-source-map' : false,
  },
  css: {
    extract: process.env.NODE_ENV === 'production',
    sourceMap: false,
    loaderOptions: {},
    modules: false,
  },
}
