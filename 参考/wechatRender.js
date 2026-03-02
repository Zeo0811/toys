// noinspection JSUnresolvedVariable,JSJQueryEfficiency
// noinspection JSUnresolvedReference
class WechatRender {
  constructor() {
    this.fontFamily = `font-family:${safeFonts};`
    this.unorderListStyle = ['disc', 'circle', 'square']
    this.orderListStyle = ['decimal', 'lower-alpha', 'lower-roman', 'upper-alpha', 'upper-roman']
    this.imageLimitation = 5
    this.links = []
    this.linkIndex = 1
    this.imageCount = 0
    this.imageIdWithPromise = []
  }

  reset() {
    this.links = []
    this.linkIndex = 1
    this.imageCount = 0
    this.imageIdWithPromise = []
    for (const key in imageCache) {
      if (imageCache.hasOwnProperty(key)) {
        delete imageCache[key];
      }
    }
  }

  async render(parsedTree) {
    this.reset()
    const $output = $('<div id="output"></div>');
    const $wechatOutput = $('<section class="output"></section>');
    if (globalTheme === "sun_blue") {
      $wechatOutput.css(themes.sun_blue.output);
    }
    $output.append($wechatOutput);
    for (const element of parsedTree) {
      const $domNode = this.doRender(element)
      const $wrap = $('<section></section>')
      $wrap.append($domNode)
      this.setTheme(themes[globalTheme], $wrap)
      $wechatOutput.append($wrap.html())
    }

    Promise.all(this.imageIdWithPromise.map(it => {
      return getCosImageUrl(it.href).then(res => {
        const key = CryptoJS.MD5(it.href).toString()
        $wechatOutput.find(`#${it.id}`).attr('src', res)
        imageCache[key] = res.substring(0, res.lastIndexOf('?'))
      })
    }))
    if (this.links.length > 0) {
      renderLinkToReference.call(this)
    }

    return $wechatOutput

    function renderLinkToReference() {
      const self = this
      const style = themes[globalTheme].h3;
      style['margin-top'] = '50px'
      const $title = self.renderH3({
        type: 'h3',
        children: [{
          type: 'text',
          text: '参考资料'
        }]
      });
      const $wrap = $('<section></section>')
      $wrap.append($title)
      self.setTheme(themes[globalTheme], $wrap)
      $title.css('margin-top', '40px')
      $wechatOutput.append($wrap.html())
      const $reference = $(`<section class="reference"></section>`);
      if (globalTheme === "sun_blue") {
        $reference.css(themes.sun_blue.reference);
      } else {
        $reference.css(themes.default.reference)
      }
      $wechatOutput.append($reference);

      for (let i = 0; i < this.links.length; i++) {
        const link = this.links[i];
        const {href, text} = link
        $reference.append(
          $(`<section class="footnotes"><span id="fn1" class="footnote-item" style="display: flex;"><span class="footnote-num" style="display: inline; margin-right: 4px; background-image: none; background-position: initial; background-size: initial; background-repeat: initial; background-attachment: initial; background-origin: initial; background-clip: initial; font-size: 80%; opacity: 0.6; line-height: 26px; font-family: ${FONT_FAMILY}">[${i + 1}]<mpchecktext contenteditable="false"></mpchecktext></span><p style="display: inline; font-size: 14px; width: 90%; line-height: 26px; word-break: break-all;">${text}: <em>${href}<mpchecktext contenteditable="false"></mpchecktext></em></p></span></section>`)
        );
      }
    }
  }

  doRender(element, level = 0) {
    if (element.type === 'h1') {
      return this.renderH1(element)
    }
    if (element.type === 'h2') {
      return this.renderH2(element)
    }
    if (element.type === 'h3') {
      return this.renderH3(element)
    }
    if (element.type === 'p') {
      return this.renderText(element, level)
    }
    if (element.type === 'bold') {
      return this.renderBold(element)
    }
    if (element.type === 'italic') {
      return this.renderItalic(element)
    }
    if (element.type === 'inlineCode') {
      return this.renderInlineCode(element)
    }
    if (element.type === 'a') {
      return this.renderLink(element)
    }
    if (element.type === 'bookmark') {
      return this.renderBookmark(element)
    }
    if (element.type === 'quote') {
      return this.renderQuote(element)
    }
    if (element.type === 'callout') {
      return this.renderCallout(element)
    }
    if (element.type === 'divider') {
      return this.renderDivider()
    }
    if (element.type === 'code') {
      return this.renderCode(element)
    }
    if (element.type === 'ul' || element.type === 'ol') {
      return this.renderList(element, 1)
    }
    if (element.type === 'table') {
      return this.renderTable(element)
    }
    if (element.type === 'image') {
      return this.renderImage(element)
    }
    if (element.type === 'columnList') {
      return this.renderColumnList(element)
    }
  }

  renderH1(element) {
    let $wrap
    let $appendTextNode

    if (globalTheme === 'simple_grey') {
      $appendTextNode = $('<section style="padding: 4px" ignore-font-size="true"></section>')
      $wrap = $(`<h1><span style="border-bottom: 1px solid #392313;display: block"></span><span style="border-top: 1px solid #392313;display: block"></span></h1>`)
    } else if (globalTheme === 'wood') {
      $appendTextNode = $('<span ignore-font-size="true"></span>')
      $wrap = $(`<h1><section class="left"></section><section class="right"></section></h1>`)
    } else {
      $wrap = $(`<h1></h1>`)
      $appendTextNode = $wrap
    }

    this.appendTextToHeader(element, $appendTextNode)
    if (globalTheme === 'simple_grey' || globalTheme === 'wood') {
      $wrap.children().first().after($appendTextNode)
    } else {
      $wrap = $appendTextNode
    }
    return $wrap
  }

  renderH2(element) {
    let $wrap
    let $appendTextNode

    if (globalTheme === 'wood') {
      $appendTextNode = $('<section></section>')
      $wrap = $(`<h2><section class="left"></section><section class="right"></section></h2>`)
    } else {
      $wrap = $(`<h2></h2>`)
      $appendTextNode = $wrap
    }

    this.appendTextToHeader(element, $appendTextNode)
    if (globalTheme === 'wood') {
      $wrap.children().first().after($appendTextNode)
    } else {
      $wrap = $appendTextNode
    }
    return $wrap
  }

  renderH3(element) {
    let $wrap
    let $appendTextNode

    if (globalTheme === 'simple_grey') {
      $appendTextNode = $('<li style="list-style-type: square"></li>')
      $wrap = $(`<h3><ul style="padding-left: 1em;color: #392313"></ul></h3>`)
    } else if (globalTheme === 'wood') {
      $appendTextNode = $('<section></section>')
      $wrap = $(`<h3><section class="left"></section><section class="right"></section></h3>`)
    } else {
      $wrap = $(`<h3></h3>`)
      $appendTextNode = $wrap
    }

    this.appendTextToHeader(element, $appendTextNode)
    if (globalTheme === 'simple_grey' || globalTheme === 'wood') {
      $wrap.children().first().after($appendTextNode)
    } else {
      $wrap = $appendTextNode
    }
    return $wrap
  }

  renderText(element, level) {
    const $wrap = $(`<p style="padding-left: ${level * 1.5}em"></p>`)
    let text = ''
    for (const node of element.children) {
      // 文本块加粗，链接这些需要拼接到同一行
      if (node.type === 'text') {
        text += node.text
      } else if (node.type === 'bold') {
        text += (this.renderBold(node))[0].outerHTML
      } else if (node.type === 'italic') {
        text += (this.renderItalic(node))[0].outerHTML
      } else if (node.type === 'a') {
        text += (this.renderLink(node))[0].outerHTML
      } else if (node.type === 'inlineCode') {
        text += (this.renderInlineCode(node))[0].outerHTML
      } else {
        $wrap.append(text)
        text = ''
        $wrap.append(this.doRender(node, level + 1))
      }
    }
    if (text !== '') {
      $wrap.append(text)
    } else if (text === '') {
      $wrap.css('min-height', '20px')
      $wrap.append($('<br>'))
    }
    return $wrap
  }

  renderBold(element) {
    const $wrap = $('<span class="strong"></span>')
    for (const node of element.children) {
      $wrap.append(node.text)
    }
    return $wrap
  }

  renderItalic(element) {
    const $wrap = $('<span class="italic"></span>')
    for (const node of element.children) {
      $wrap.append(node.text)
    }
    return $wrap
  }

  renderInlineCode(element) {
    const $wrap = $('<span class="inlineCode"></span>')
    for (const node of element.children) {
      $wrap.append(node.text)
    }
    return $wrap
  }

  renderLink(element) {
    let aText
    for (const node of element.children) {
      if (node.type === 'text') {
        aText = node.text
      }
    }
    let $wrap
    if (aText.startsWith('https://') || element.href.startsWith('https://mp.weixin.qq.com/')) {
      $wrap = $(`<a href="${element.href}"><strong>${aText}</strong></a>`)
    } else {
      $wrap = $(`<a><strong>${aText}<sup>[${this.linkIndex}]<mpchecktext contenteditable="false"></mpchecktext></sup></strong></a>`)
      this.linkIndex += 1
      this.links.push({
        href: element.href,
        text: aText
      })
    }
    return $wrap
  }

  renderBookmark(element) {
    const href = element.children[0].href
    const aText = element.children[1].text
    let $wrap
    if (href.startsWith('https://mp.weixin.qq.com/')) {
      $wrap = $(`<p><a href="${href}"><strong>${aText}</strong></a></p>`)
    } else {
      $wrap = $(`<p><a><strong>${aText}<sup>[${this.linkIndex}]<mpchecktext contenteditable="false"></mpchecktext></sup></strong></a></p>`)
      this.linkIndex += 1
      this.links.push({
        href,
        text: aText
      })
    }
    return $wrap
  }

  renderQuote(element) {
    const $resultBlockquote = $(`<blockquote class="js-blockquote-wrap"><section class="js-blockquote-digest"></section></blockquote>`)
    if (globalTheme === 'sun_blue') {
      $resultBlockquote.prepend('<span ignore-font-size="true" style="color: #19a9d7;font-size: 34px;line-height: 1;font-weight: 700;">❝</span>')
    } else if (globalTheme === 'simple_grey') {
      $resultBlockquote.prepend('<span ignore-font-size="true" class="begin-quote">“</span>')
    }

    for (const node of element.children) {
      if (node.type === 'text') {
        $resultBlockquote.find('.js-blockquote-digest').append(node.text)
      } else {
        $resultBlockquote.find('.js-blockquote-digest').append(this.doRender(node))
      }
    }

    if (globalTheme === 'sun_blue') {
      $resultBlockquote.append('<span ignore-font-size="true" style="float: right;color: #19a9d7;">❞</span>')
    } else if (globalTheme === 'simple_grey') {
      $resultBlockquote.append('<span ignore-font-size="true" class="end-quote">”</span>')
    }

    return $resultBlockquote
  }

  renderCallout(element) {
    const emoji = element.children[0].text
    let $resultCallout
    if (globalTheme === 'default') {
      $resultCallout = $(`<section class="wechat-callout-wrapper">
        <div style="margin-right: 10px"><span>${emoji}</span></div>
        <section class="callout" style="white-space: normal;outline: 0;flex: 1 1 auto">
          <div class="wechat-callout-block" style="${this.fontFamily}"></div>
        </section>
      </section>`)
    } else {
      $resultCallout = $(`<section class="styled-callout">
        <section class="header-wrapper" style="margin-bottom: 10px;">
          <section class="styled-callout-header">
            <section style="margin-top: 10px;font-size: 20px;">
              <p>${emoji}</p>
            </section>
          </section>
        </section>
        <section class="wechat-callout-block"></section>
      </section>`)
    }

    for (const node of element.children.slice(1)) {
      if (node.type === 'text') {
        $resultCallout.find('.wechat-callout-block').append(node.text)
      } else {
        $resultCallout.find('.wechat-callout-block').append(this.doRender(node))
      }
    }
    return $resultCallout
  }

  renderDivider() {
    return $(`<hr/>`)
  }

  renderCode(element) {
    let code = ''
    for (const node of element.children) {
      code += node.text
    }
    const $code = $('<code></code>')
    $code.text(code)
    const $preResult = $(`<pre></pre>`)
    $preResult.append($code)
    hljs.highlightElement($preResult[0])

    const theme = codeThemes.defaultTheme
    $.each($preResult.find('span'), function (index, item) {
      const $item = $(item)
      const clazz = $item.attr('class').split(' ')[0]
      if (theme.hasOwnProperty(clazz)) {
        $item.css(theme[clazz])
      }
    })

    // 代码块的菜单栏
    const $topBar = $(`<section style="display: flex;flex-direction: row;align-items: center;column-gap: 6px;margin-bottom: 4px;">
<section style="width: 10px;height: 10px;border-radius: 50%;background-color: #ed6c60;"></section>
<section style="width: 10px;height: 10px;border-radius: 50%;background-color: #f7c151;"></section>
<section style="width: 10px;height: 10px;border-radius: 50%;background-color: #64c856;"></section>
</section>`)
    $preResult.removeAttr('class')

    $preResult.prepend($topBar)
    return $preResult
  }

  renderList(element) {
    let $wrap
    if (element.type === 'ul') {
      $wrap = $(`<ul style="list-style-type: ${this.unorderListStyle[element.ulLevel % 3]};" class="nc-list"></ul>`)
    } else if (element.type === 'ol') {
      $wrap = $(`<ol style="list-style-type: ${this.orderListStyle[element.olLevel % 5]};" class="nc-list"></ol>`)
    } else {
      console.error(`element with type: ${element.type} not support`)
      return
    }
    let text = ''
    for (const node of element.children) {
      if (node.type === 'li') {
        for (const nestNode of node.children) {
          if (nestNode.type === 'text') {
            text += nestNode.text
          } else {
            text += (this.doRender(nestNode))[0].outerHTML
          }
        }
        $wrap.append(`<li><p>${text}</p></li>`)
        text = ''
      } else {
        $wrap.append(this.doRender(node))
      }
    }
    if (text !== '') {
      $wrap.append(`<li>${text}</li>`)
    }
    return $wrap
  }

  renderTable(element) {
    const $appendTable = $('<table></table>')
    const $tbody = $('<tbody></tbody>')
    const trs = element.children
    for (const tr of trs) {
      const tds = tr.children
      const width = 536 / tds.length
      const $appendTr = $('<tr></tr>')
      for (const td of tds) {
        const $td = $(`<td width="${width}" valign="top" style="word-break: break-all;${this.fontFamily};font-size: 15px"></td>`)
        for (const node of td.children) {
          if (node.type === 'text') {
            $td.append(node.text)
          } else {
            $td.append(this.doRender(node))
          }
        }
        $appendTr.append($td)
      }
      $tbody.append($appendTr)
    }
    $appendTable.append($tbody)
    return $appendTable
  }

  renderImage(element) {
    const id = generateUUID()
    const $image = $(`<img id="${id}" src="${chrome.runtime.getURL('imgs/loading.gif')}" alt="loading" width="100%"/>`)
    const $resultImageBlock = $(`<figure class="figure" style="margin: 0"></figure>`);
    $resultImageBlock.append($image);

    for (const node of element.children) {
      // caption
      if (node.type === 'text') {
        const $figcaption = $(`<figcaption style="color: #888; text-align: center; font-size: 14px;margin-top: 5px;font-family: ${FONT_FAMILY}"></figcaption>`);
        $figcaption.text(node.text);
        $resultImageBlock.append($figcaption);
      } else {
        if (!vip && this.imageCount < this.imageLimitation) {
          this.imageIdWithPromise.push({
            id,
            href: node.href,
          })
          this.imageCount += 1
        } else if (!vip && this.imageCount >= this.imageLimitation) {
          $image.attr('src', `${chrome.runtime.getURL('/imgs/upgrade.png')}`)
            .css('cursor', 'pointer')
            .addClass('vip-hint-img')
        } else {
          this.imageIdWithPromise.push({
            id,
            href: node.href,
          })
        }
      }
    }
    return $resultImageBlock
  }

  renderColumnList(element) {
    const $sectionColumn = $(`<section class="column-list" style="display: flex;column-gap: 10px"></section>`);
    for (const node of element.children) {
      const $section = $('<section style="flex: 0 1 50%"></section>')
      $sectionColumn.append($section)
      for (const n of node.children) {
        $section.append(this.doRender(n))
      }
    }
    return $sectionColumn
  }

  setTheme(theme, $node, parentTagName = "") {
    $.each($node.children(), (index, item) => {
      const $this = $(item);
      const clazz = $this.attr("class");
      const tagName = item.tagName.toLowerCase();
      let finalTagName =
        parentTagName === ""
          ? tagName
          : `${parentTagName}_${item.tagName.toLowerCase()}`;
      if (clazz) {
        finalTagName += `.${clazz}`;
      }
      const style = $this.attr('style')
      const styleObject = this.convertStyleToObject(style)
      // 嵌套元素样式在theme里有
      if (theme.hasOwnProperty(finalTagName)) {
        // 设置列表样式
        if (tagName === "ol" || tagName === "ul") {
          theme[finalTagName]["list-style-type"] = $this.css("list-style-type");
          theme[finalTagName]["color"] = theme[finalTagName].color;
        }
        if (Object.keys(theme[finalTagName]).length !== 0) {
          $this.attr("style", "");
          const finalStyle = Object.assign(styleObject, theme[finalTagName])
          $this.css(finalStyle);
        }
      } else {
        // 如果选择主题没有对应标签样式，用默认主题样式
        const defaultStyle = themes.default;
        if (defaultStyle.hasOwnProperty(finalTagName)) {
          $this.attr("style", "");
          const finalStyle = Object.assign(styleObject, defaultStyle[finalTagName])
          $this.css(finalStyle);
        } else {
          // 复杂嵌套时，需要去掉父元素的classname，比如列表中嵌套了callout，需要在递归时去除列表的tag属性
          const selfTagName = finalTagName.replace(`${parentTagName}_`, '')
          finalTagName = selfTagName
          if (theme.hasOwnProperty(selfTagName)) {
            if (tagName === "ol" || tagName === "ul") {
              theme[selfTagName]["list-style-type"] = $this.css("list-style-type");
              theme[selfTagName]["color"] = theme[selfTagName].color;
            }
            if (Object.keys(theme[selfTagName]).length !== 0) {
              $this.attr("style", "");
              const finalStyle = Object.assign(styleObject, theme[selfTagName])
              $this.css(finalStyle);
            }
          } else if (defaultStyle.hasOwnProperty(selfTagName)) {
            $this.attr("style", "");
            const finalStyle = Object.assign(styleObject, defaultStyle[selfTagName])
            $this.css(finalStyle);
          }
        }
      }
      // 设置嵌套标签样式, 用 parent_child 结构描述
      this.setTheme(theme, $this, finalTagName);
    });
  }

  setFont(fontName, $node) {
    const font = chineseFonts[fontName];
    $.each($node.children(), (index, item) => {
      const $this = $(item);
      const fontFamily = $this.css("font-family");
      if (fontFamily) {
        $this.css("font-family", font);
      }
      this.setFont(fontName, $this);
    });
  }

  setFontSize(fontSize, $wechatOutput) {
    $wechatOutput
      .find("*:not(h1):not(h2):not(h3):not([ignore-font-size=true])")
      .each(function () {
        $(this).css("font-size", fontSize);
      });
    const fontValue = parseInt(fontSize.replace('px', ''))
    $wechatOutput.find("h1").css("font-size", `${fontValue + 9}px`);
    $wechatOutput.find("h2").css("font-size", `${fontValue + 5}px`);
    $wechatOutput.find("h3").css("font-size", `${fontValue + 2}px`);
  }

  /*
  * style: "display: block" -> {"display": "block"}
  * */
  convertStyleToObject(style) {
    const result = {}
    if (style === undefined) {
      return result
    }
    const styleLines = style.split(';')
      .filter(it => it !== '')
    styleLines.reduce((previousValue, currentValue) => {
      const array = currentValue.split(':')
      previousValue[array[0].trim()] = array[1].trim()
      return previousValue
    }, result)

    return result
  }

  appendTextToHeader(element, $appendTextNode) {
    for (const node of element.children) {
      if (node.type === 'text') {
        $appendTextNode.append(node.text)
      } else {
        if (node.type === 'bold') {
          for (const n of node.children) {
            if (n.type === 'text') {
              $appendTextNode.append(n.text)
            }
          }
        } else {
          $appendTextNode.append(this.doRender(node))
        }
      }
    }
  }
}