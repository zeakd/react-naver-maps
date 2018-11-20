module.exports = {
  presets: [
    ['@babel/preset-env', {
      exclude: ['transform-regenerator'],
      // useBuiltIns: 'usage',
    },],
    '@babel/preset-react',
  ],
  plugins: [
    // '@babel/plugin-external-helpers'
  ]
}