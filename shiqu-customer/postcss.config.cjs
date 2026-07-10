/**
 * px → rem（375 逻辑像素：写 16px 即手机显示 16px）
 * 运行时由 public/flexible.js 同步设置 html font-size
 */
module.exports = {
  plugins: {
    'postcss-pxtorem': {
      rootValue: 37.5,
      unitPrecision: 5,
      propList: ['*'],
      selectorBlackList: ['.ignore', /^\.van-hairline/],
      replace: true,
      mediaQuery: false,
      minPixelValue: 1,
      exclude: /node_modules\/(?!vant)/,
    },
  },
}
