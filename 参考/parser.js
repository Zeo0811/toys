const parser = {
  notionBlockClasses: [
    'notion-header-block', 'notion-link-token', 'notion-sub_header-block', 'notion-sub_sub_header-block', 'notion-text-block', 'notion-enable-hover',
    'notion-quote-block', 'notion-callout-block', 'notion-code-block', 'notion-divider-block', 'notion-bulleted_list-block', 'notion-numbered_list-block',
    'notion-image-block', 'notion-table-block', 'notion-column_list-block', 'notion-bookmark-block'
  ],
  parse: function (html, mergeList) {
    const dom = window.HTMLDOMParser(html)
    const result = []
    for (const element of dom) {
      try {
        result.push(this.doParse(element, {ulLevel: 0, olLevel: 0}))
      } catch (e) {
        console.trace(e)
      }
    }

    if (mergeList) {
      this.mergeListItems(result, 'ol')
      this.mergeListItems(result, 'ul')
    }
    console.log('result', result)
    return result
  },

  doParse: function (element, params) {
    if (element.type === 'text') {
      return {}
    }
    if (element.attribs.role === 'img') {
      return this.parseText(element.children[0])
    }
    const classes = element.attribs.class
    if (classes.indexOf('notion-header-block') !== -1) {
      const children = []
      this.parseHeader(element, children)
      return {
        type: 'h1',
        children
      }
    }
    if (classes.indexOf('notion-sub_header-block') !== -1) {
      const children = []
      this.parseHeader(element, children)
      return {
        type: 'h2',
        children
      }
    }
    if (classes.indexOf('notion-sub_sub_header-block') !== -1) {
      const children = []
      this.parseHeader(element, children)
      return {
        type: 'h3',
        children
      }
    }
    if (classes.indexOf('notion-text-block') !== -1) {
      const children = []
      this.parseTextBlock(element, children)
      return {
        type: 'p',
        children
      }
    }
    if (classes.indexOf('notion-link-token') !== -1) {
      const children = []
      this.parseLink(element, children)
      const href = element.attribs.href
      return {
        type: 'a',
        children,
        href
      }
    }
    if (classes.indexOf('notion-bookmark-block') !== -1) {
      const children = []
      this.parseBookmark(element, children)
      return {
        type: 'bookmark',
        children,
      }
    }
    if (classes.indexOf('notion-enable-hover') !== -1) {
      const style = element.attribs.style
      const children = []
      if (style.indexOf('font-weight') !== -1) {
        this.parseBold(element, children)
        return {
          type: 'bold',
          children
        }
      } else if (style === 'font-style:italic') {
        this.parseItalic(element, children)
        return {
          type: 'italic',
          children
        }
      } else {
        if (element.children[0]?.attribs?.role === 'img') {
          this.parseEmoji(element, children)
          return {
            type: 'text',
            text: children[0].text
          }
        } else if (style.indexOf('background') !== -1) {
          this.parseInlineCode(element, children)
          return {
            type: 'inlineCode',
            children
          }
        } else {
          return this.parseText(element.children[0])
        }
      }
    }
    if (classes.indexOf('notion-quote-block') !== -1) {
      const children = []
      this.parseQuote(element, children)
      return {
        type: 'quote',
        children,
      }
    }
    if (classes.indexOf('notion-callout-block') !== -1) {
      const children = []
      this.parseCalloutBlock(element, children)
      return {
        type: 'callout',
        children,
      }
    }
    if (classes.indexOf('notion-code-block') !== -1) {
      const children = []
      this.parseCode(element, children)
      return {
        type: 'code',
        children,
      }
    }
    if (classes.indexOf('notion-divider-block') !== -1) {
      return this.parseDivider()
    }
    if (classes.indexOf('notion-bulleted_list-block') !== -1) {
      const children = []
      const ulLevel = params?.ulLevel === undefined ? 0 : params.ulLevel
      const olLevel = params?.olLevel === undefined ? 0 : params.olLevel
      this.parseList(element, children, ulLevel, olLevel, 'ul')
      return {
        type: 'ul',
        children,
        ulLevel
      }
    }
    if (classes.indexOf('notion-numbered_list-block') !== -1) {
      const children = []
      const ulLevel = params?.ulLevel === undefined ? 0 : params.ulLevel
      const olLevel = params?.olLevel === undefined ? 0 : params.olLevel
      this.parseList(element, children, ulLevel, olLevel, 'ol')
      return {
        type: 'ol',
        children,
        olLevel
      }
    }
    if (classes.indexOf('notion-image-block') !== -1) {
      const children = []
      this.parseImageBlock(element, children)
      return {
        type: 'image',
        children,
      }
    }
    if (classes.indexOf('notion-table-block') !== -1) {
      const children = []
      this.parseTable(element, children)
      return {
        type: 'table',
        children,
      }
    }
    if (classes.indexOf('notion-column_list-block') !== -1) {
      const children = []
      this.parseColumnList(element, children)
      return {
        type: 'columnList',
        children,
      }
    }
    return {}
  },

  parseHeader(element, children) {
    for (const c of element.children) {
      if (c.type === 'text') {
        children.push(this.parseText(c))
      } else {
        if (c.attribs.hasOwnProperty('class')) {
          const classes = c.attribs.class
          if (classes.split(' ').some(it => this.notionBlockClasses.indexOf(it) !== -1)) {
            children.push(this.doParse(c))
          } else {
            this.parseHeader(c, children)
          }
        } else {
          this.parseHeader(c, children)
        }
      }
    }
  },

  parseTextBlock(element, children) {
    for (const c of element.children) {
      if (c.type === 'text') {
        children.push(this.parseText(c))
      } else {
        if (c.attribs.hasOwnProperty('class')) {
          const classes = c.attribs.class
          if (classes.split(' ').some(it => this.notionBlockClasses.indexOf(it) !== -1)) {
            const intendElement = this.doParse(c)
            if (intendElement) {
              children.push(intendElement)
            }
          } else {
            this.parseTextBlock(c, children)
          }
        } else {
          this.parseTextBlock(c, children)
        }
      }
    }
  },

  parseLink(element, children) {
    for (const c of element.children) {
      if (c.type === 'text') {
        children.push(this.parseText(c))
      } else {
        this.parseLink(c, children)
      }
    }
  },

  parseBookmark(element, children) {
    if (element.name === 'a') {
      children.push({
        type: 'a',
        href: element.attribs.href
      })
    }
    for (const c of element.children) {
      if (c.type === 'text') {
        children.push(this.parseText(c))
      } else {
        this.parseBookmark(c, children)
      }
    }
  },

  parseBold(element, children) {
    for (const node of element.children) {
      if (node.type === 'text') {
        children.push(this.parseText(node))
      } else {
        this.parseBold(node, children)
      }
    }
  },

  parseItalic(element, children) {
    children.push(this.parseText(element.children[0]))
  },

  parseInlineCode(element, children) {
    for (const node of element.children) {
      if (node.type === 'text') {
        children.push(this.parseText(node))
      } else {
        children.push(this.doParse(node))
      }
    }
  },

  parseEmoji(element, children) {
    children.push(this.parseText(element.children[0].children[0]))
  },

  parseQuote(element, children) {
    // 使得同一个文本块下的文本在一个p块里，不会让加粗，链接等块出现换行
    if (element.attribs.class === 'notranslate') {
      const p = {
        type: 'p',
        children: []
      }
      children.push(p)
      children = p.children
    }
    for (const c of element.children) {
      if (c.type === 'text') {
        children.push(this.parseText(c))
      } else {
        if (c.attribs.hasOwnProperty('class')) {
          const classes = c.attribs.class
          if (classes.split(' ').some(it => this.notionBlockClasses.indexOf(it) !== -1)) {
            appendNonEmptyChildren(children, this.doParse.bind(this, c))
          } else {
            this.parseQuote(c, children)
          }
        } else {
          this.parseQuote(c, children)
        }
      }
    }
  },

  parseCalloutBlock(element, children) {
    // 使得同一个文本块下的文本在一个p块里，不会让加粗，链接等块出现换行
    if (element.attribs.class === 'notranslate') {
      const p = {
        type: 'p',
        children: []
      }
      children.push(p)
      children = p.children
    }
    for (const c of element.children) {
      if (c.type === 'text') {
        children.push(this.parseText(c))
      } else if (c.attribs.class === 'notion-emoji') {
        children.push({
          type: 'text',
          text: c.attribs.alt
        })
      } else {
        if (c.attribs.hasOwnProperty('class')) {
          const classes = c.attribs.class
          if (classes.split(' ').some(it => this.notionBlockClasses.indexOf(it) !== -1)) {
            appendNonEmptyChildren(children, this.doParse.bind(this, c))
          } else {
            this.parseCalloutBlock(c, children)
          }
        } else {
          this.parseCalloutBlock(c, children)
        }
      }
    }
  },

  parseCode(element, children) {
    if (element.type === 'text') {
      return
    }
    for (const c of element.children) {
      if (c.hasOwnProperty('attribs') && c.attribs.hasOwnProperty('class')) {
        const classes = c.attribs.class
        if (classes.split(' ').some(it => it === 'line-numbers')) {
          const node = c.children[0]
          for (const n of node.children) {
            // code block 在不同语言时的结构不一样，plain text时没有span包裹，直接解析文本即可
            if (n.type === 'text') {
              children.push(this.parseText(n))
            } else {
              children.push(this.parseText(n.children[0]))
            }
          }
        } else {
          this.parseCode(c, children)
        }
      } else {
        this.parseCode(c, children)
      }
    }
  },

  parseDivider() {
    return {
      type: 'divider'
    }
  },

  parseList(element, children, ulLevel, olLevel, currentType) {
    // 如果遇到列表的文本，需要用li包裹所有文本，确保在render的时候不会被识别成2个block，从而导致换行
    if (element.attribs.class === 'notranslate') {
      // 使得同一个文本块下的文本在一个p块里，不会让加粗，链接等块出现换行
      if (!children.some(it => it.type === 'li')) {
        const li = {
          type: 'li',
          children: []
        }
        children.push(li)
        children = li.children
      }
    }
    for (const c of element.children) {
      if (c.type === 'text') {
        children.push(this.parseText(c))
      } else {
        if (c.hasOwnProperty('attribs') && c.attribs.hasOwnProperty('class')) {
          const classes = c.attribs.class
          if (classes.split(' ').some(it => this.notionBlockClasses.indexOf(it) !== -1)) {
            let _olLevel = olLevel, _ulLevel = ulLevel
            /*
            * 当currentType和嵌套列表类型一致时，对应的列表level才需要增加
            * */
            if (classes.indexOf('notion-bulleted_list-block') !== -1) {
              if (currentType === 'ul') {
                _ulLevel += 1
              }
            } else if (classes.indexOf('notion-numbered_list-block')) {
              if (currentType === 'ol') {
                _olLevel += 1
              }
            }
            appendNonEmptyChildren(children, this.doParse.bind(this, c, {ulLevel: _ulLevel, olLevel: _olLevel, lastType: currentType}))
          } else {
            this.parseList(c, children, ulLevel, olLevel, currentType)
          }
        } else {
          this.parseList(c, children, ulLevel, olLevel, currentType)
        }
      }
    }
  },

  parseImageBlock(element, children) {
    for (const c of element.children) {
      if (c.name === 'img') {
        children.push(this.parseImage(c))
      } else if (c.type === 'text' && c.parent.attribs.class === 'notranslate') {
        children.push(this.parseText(c))
      } else if (c.type !== 'text') {
        this.parseImageBlock(c, children)
      }
    }
  },

  parseTable(element, children) {
    for (const c of element.children) {
      if (c.name === 'tbody') {
        for (const tr of c.children) {
          const trChildren = []
          for (const td of tr.children) {
            const tdObject = {
              type: 'td',
              children: []
            }
            this.parseTd(td, tdObject)
            trChildren.push(tdObject)
          }
          children.push({
            type: 'tr',
            children: trChildren
          })
        }
      } else {
        this.parseTable(c, children)
      }
    }
  },

  parseTd(element, tdObject) {
    for (const c of element.children) {
      if (c.type === 'text') {
        tdObject.children.push(this.parseText(c))
      } else {
        if (c.hasOwnProperty('attribs') && c.attribs.hasOwnProperty('class')) {
          const classes = c.attribs.class
          if (classes.split(' ').some(it => this.notionBlockClasses.indexOf(it) !== -1)) {
            appendNonEmptyChildren(tdObject.children, this.doParse.bind(this, c))
          } else {
            this.parseTd(c, tdObject)
          }
        } else {
          this.parseTd(c, tdObject)
        }
      }
    }
  },

  parseColumnList(element, children) {
    if (element.hasOwnProperty('attribs') && (element.attribs.class || '').indexOf('notion-column-block') !== -1) {
      const columnBlock = {
        type: 'columnBlock',
        children: []
      }
      children.push(columnBlock)
      children = columnBlock.children
    }
    for (const c of element.children) {
      if (c.type === 'text') {
        children.push(this.parseText(c))
      } else {
        if (c.hasOwnProperty('attribs') && c.attribs.hasOwnProperty('class')) {
          const classes = c.attribs.class
          if (classes.split(' ').some(it => this.notionBlockClasses.indexOf(it) !== -1)) {
            appendNonEmptyChildren(children, this.doParse.bind(this, c))
          } else {
            this.parseColumnList(c, children)
          }
        } else {
          this.parseColumnList(c, children)
        }
      }
    }
  },

  parseImage(element) {
    return {
      type: 'image',
      href: element.attribs.src
    }
  },

  parseText(element) {
    return {
      type: 'text',
      text: element.data
    }
  },

  /*
  * 由于notion的列表没有维持嵌套结构，每个列表项都是单独的block，所以需要把单独的列表项转换成
  * 嵌套的结构，相邻的同一级的ol|ul，需要把除了第一个，其他所有的children放进第一个ol的children，然后
  * 对第一个ol的children递归执行相同逻辑
  * */
  mergeListItems(items, type) {
    let firstOlIndex = -1

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type === type) {
        // 第一个ol
        if (firstOlIndex === -1) {
          firstOlIndex = i
        } else {
          items[firstOlIndex].children.push(...item.children);
          items.splice(i, 1)
          i--; // Adjust the index after removal
        }
      } else {
        // 不是连续的了，递归处理当前连续的，然后继续处理不连续的
        if (firstOlIndex !== -1 && items[firstOlIndex].children && items[firstOlIndex].children.length > 0) {
          this.mergeListItems(items[firstOlIndex].children, 'ul')
          this.mergeListItems(items[firstOlIndex].children, 'ol')
        }
        firstOlIndex = -1
      }
    }
    // 如果只有一个列表项，处理它的嵌套列表
    if (firstOlIndex !== -1 && items[firstOlIndex].children && items[firstOlIndex].children.length > 0) {
      this.mergeListItems(items[firstOlIndex].children, 'ul')
      this.mergeListItems(items[firstOlIndex].children, 'ol')
    }
  },
}

function appendNonEmptyChildren(array, fn) {
  const result = fn()
  // 防止加入空的节点，像divider没有children的可以加入
  if (!result.hasOwnProperty('children') || result.children.length > 0) {
    array.push(result)
  }
}