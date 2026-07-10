/**
 * 须在应用脚本之前同步执行，否则 rem 会按浏览器默认 16px 计算导致字号偏小
 * 配合 postcss-pxtorem（rootValue: 37.5）使用
 */
;(function () {
  var maxWidth = 768

  function setRootFZ() {
    var clientWidth = document.documentElement.clientWidth
    if (clientWidth > maxWidth) {
      clientWidth = maxWidth
    }
    var rem = clientWidth / 10

    document.documentElement.style.fontSize = rem + 'px'
    document.documentElement.style.width = '100%'
    document.documentElement.style.maxWidth = maxWidth + 'px'
    document.documentElement.style.margin = '0 auto'
  }

  setRootFZ()
  window.addEventListener('resize', setRootFZ)
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      setRootFZ()
    }
  })
})()

;(function () {
  function handleFontSize() {
    window.WeixinJSBridge.invoke('setFontSizeCallback', { fontSize: 0 })
    window.WeixinJSBridge.on('menu:setfont', function () {
      window.WeixinJSBridge.invoke('setFontSizeCallback', { fontSize: 0 })
    })
  }

  if (
    typeof window.WeixinJSBridge === 'object' &&
    typeof window.WeixinJSBridge.invoke === 'function'
  ) {
    handleFontSize()
    return
  }

  document.addEventListener('WeixinJSBridgeReady', handleFontSize, false)
})()
