module.exports = {
  presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    ['module-resolver', { alias: { '@': './src' } }],
    'react-native-worklets/plugin',
  ],
};
