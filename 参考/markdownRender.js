const markdownRender = {
	async render(parsedTree) {
		const output = []
		for (const element of parsedTree) {
			try {
				let renderNode = await this.doRender(element, {indent: 0})
				if (element.type === 'ol' || element.type === 'ul') {
					renderNode += '\n'
				}
				output.push(renderNode)
			} catch (e) {}
		}

		return output.join('\n')
	},

	async doRender(element, param) {
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
			return this.renderText(element)
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
			return this.renderQuote(element, param.indent)
		}
		if (element.type === 'callout') {
			return this.renderCallout(element, param.indent)
		}
		if (element.type === 'divider') {
			return this.renderDivider()
		}
		if (element.type === 'code') {
			return this.renderCode(element, param.indent)
		}
		if (element.type === 'ul' || element.type === 'ol') {
			return this.renderList(element, param.indent)
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
	},

	async getHeaderText(element) {
		let text = ''
		for (const node of element.children) {
			if (node.type === 'text') {
				text += node.text
			} else {
				text += await this.doRender(node)
			}
		}
		return text
	},

	async renderH1(element) {
		const text = await this.getHeaderText(element)
		return `# ${text}`;
	},

	async renderH2(element) {
		const text = await this.getHeaderText(element)
		return `## ${text}`;
	},

	async renderH3(element) {
		const text = await this.getHeaderText(element)
		return `### ${text}`;
	},

	async renderText(element) {
		const $wrap = []
		for (const node of element.children) {
			if (node.type === 'text') {
				$wrap.push(node.text)
			} else {
				$wrap.push(await this.doRender(node))
			}
		}
		return $wrap.join('') + '\n'
	},

	renderBold(element) {
		const $wrap = []
		for (const node of element.children) {
			$wrap.push(node.text)
		}
		return `**${$wrap.join('')}**`
	},

	renderItalic(element) {
		const $wrap = []
		for (const node of element.children) {
			$wrap.push(node.text)
		}
		return `_${$wrap.join('')}_`
	},

	renderInlineCode(element) {
		const $wrap = []
		for (const node of element.children) {
			$wrap.push(node.text)
		}
		return `\`${$wrap.join('')}\``
	},

	renderLink(element) {
		let aText
		for (const node of element.children) {
			if (node.type === 'text') {
				aText = node.text
			}
		}
		return `[${aText}](${element.href})`;
	},

	renderBookmark(element) {
		const href = element.children[0].href
		const aText = element.children[1].text
		return `[${aText}](${href})`;
	},

	async renderQuote(element, indent) {
		let text = ''
		for (const node of element.children) {
			if (node.type === 'text') {
				text += node.text
			} else {
				text += await this.doRender(node, {indent})
			}
		}
		return text.split('\n').map(it => `${this.getIndent(indent)}> ${it}`).join('\n') + '\n'
	},

	async renderCallout(element, indent) {
		const emoji = element.children[0].text
		let text = ''

		for (const node of element.children.slice(1)) {
			if (node.type === 'text') {
				text += node.text
			} else {
				text += await this.doRender(node, {indent})
			}
		}
		return `${this.getIndent(indent)}> ${emoji}\n${text.split('\n').map(it => `${this.getIndent(indent)}> ${it}`).join('\n')}\n`;
	},

	renderDivider() {
		return '---'
	},

	renderCode(element, indent) {
		const indentStr = this.getIndent(indent)
		let code = ''
		for (const node of element.children) {
			code += node.text
		}
		return `${indentStr}\`\`\`
${indentStr}${code}
${indentStr}\`\`\``
	},

	async renderList(element, indent) {
		let $wrap
		if (element.type === 'ul') {
			$wrap = '- '
		} else if (element.type === 'ol') {
			$wrap = `1. `
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
						text += await this.doRender(nestNode)
					}
				}
				$wrap += text
				text = ''
			} else {
				$wrap = $wrap + '\n' + (await this.doRender(node, {indent: indent + 1}))
			}
		}
		if (text !== '') {
			$wrap += text
		}
		return $wrap
	},

	async renderTable(element) {
		const tableArray = []
		const trs = element.children
		for (const tr of trs) {
			const tds = tr.children
			const tdArray = []
			for (const td of tds) {
				for (const node of td.children) {
					if (node.type === 'text') {
						tdArray.push(node.text)
					} else {
						tdArray.push(await this.doRender(node))
					}
				}
			}
			tableArray.push(tdArray)
		}
		let table = ''
		for (let i = 0; i < tableArray.length; i++) {
			table = table + '|' + tableArray[i].join('|') + '|' + '\n'
			if (i === 0) {
				table = table +  '|' +  new Array(tableArray[i].length).fill('----').join('|') + '|' + '\n'
			}
		}
		return table
	},

	async renderImage(element) {
		let alt = ''
		let href = ''

		for (const node of element.children) {
			// caption
			if (node.type === 'text') {
				alt = node.text
			} else {
				const key = CryptoJS.MD5(node.href).toString()
				if (imageCache.hasOwnProperty(key)) {
					href = imageCache[key]
				} else {
					href = await getCosImageUrl(node.href, false)
				}
			}
		}
		return `![${alt}](${href})`;
	},

	async renderColumnList(element) {
		const elements = []
		for (const children of element.children) {
			elements.push((await this.doRender(children.children[0])).replace('\n', ''))
		}
		return `|${elements.join('|')}|\n`
	},

	/*
	* 如果有block嵌套在列表里，需要缩进层级
	* */
	getIndent(indent) {
		return `${'\t'.repeat(indent)}`
	}
}