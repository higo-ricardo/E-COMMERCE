// babel.config.js
// Configuracao do Babel para Jest

export default {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }]
  ]
}
