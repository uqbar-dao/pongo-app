module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      "react-native-reanimated/plugin",
      [
        "module-resolver",
        {
          extensions: [".tsx", ".ts", ".jsx", "js", ".json"],
          alias: {
            'react-native$': 'react-native-web'
          },
        },
      ]
    ],
  };
};
