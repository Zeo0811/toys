const FONT_FAMILY = "Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, 'PingFang SC', Cambria, Cochin, Georgia, Times, 'Times New Roman', serif"
const PIE_FAMILY = "'Source Sans Pro', 'MiSans', '等距更纱黑体 SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif"
const commonStyles = {
	h1: {
		'line-height':1.5,
		'font-size':'24px',
		'font-family': FONT_FAMILY,
		'font-weight': 'bold',
		margin:'80px auto 40px auto',
		width: 'fit-content'
	},
	h2: {
		'line-height':1.5,
		'font-family': FONT_FAMILY,
		'font-size':'20px',
		'font-weight': 'bold',
		margin:'40px auto',
		width: 'fit-content'
	},
	h3: {
		'line-height':1.5,
		'font-family': FONT_FAMILY,
		'font-size':'17px',
		'font-weight': 'bold',
		margin:'40px 0',
		width: 'fit-content'
	},
	pre: {
		margin: '20px 10px',
		display: 'block',
		'font-size': '15px',
		padding: '10px',
		color: '#333',
		position: 'relative',
		'background-color': '#fafafa',
		border: '1px solid #f0f0f0',
		'border-radius': '5px',
		'white-space': 'pre',
		'box-shadow': 'rgba(0, 0, 0, 0.3) 0px 2px 10px',
		overflow: 'auto',
		'font-family': 'Operator Mono, Consolas, Monaco, Menlo, monospace'
	},
	'blockquote.js-blockquote-wrap': {
		'line-height': '26px',
		'word-spacing': 'normal'
	},
	'section.styled-callout': {
		'font-size': '15px',
		'white-space': 'normal',
		margin: '20px 0',
		color: 'rgba(0, 0, 0, 0.9)',
		'font-family': FONT_FAMILY,
		'line-height': '26px'
	},
	'section.styled-callout_section.wechat-callout-block': {
		padding: '0 12px 15px',
		color: '#3f3f3f',
		'letter-spacing': '0.1em'
	},
	p: {
		'text-align':'left',
		'line-height': '26px',
		'font-family': FONT_FAMILY,
		margin:'10px 0',
		'letter-spacing':'0.1em',
		'white-space': 'pre-line',
		color: 'rgb(63, 63, 63)',
		'font-size': '15px',
	},
	'span.inlineCode': {
		background: 'rgba(135,131,120,.15)',
		'border-radius': '4px',
		'font-size': '85%',
		padding: '0.2em 0.4em'
	},
	'span.strong': {
		'word-break': 'break-all'
	},
	a: {
		'text-decoration': 'none',
		'border-bottom': '1px solid #000',
	},
	'a.no-link': {
		'text-decoration': 'none',
		'border-bottom': 'none'
	},
	p_span: {
		color: 'inherit',
		'word-break': 'break-all',
		'border-bottom': '1px solid #000',
	},
	a_span: {
		'border-bottom': '0.05em solid',
		'border-color': 'rgba(55,53,47,0.4)',
		opacity: 0.7
	},
	'ul.nc-list': {
		'padding-left': '1.5em',
		'border-width': '0px',
		'border-style': 'initial',
		'border-color': 'initial',
		'font-variant-numeric': 'inherit',
		'font-variant-east-asian': 'inherit',
		'font-stretch': 'inherit',
		'font-size': '15px',
		'line-height': '1.75',
		'font-family': FONT_FAMILY,
		'vertical-align': 'baseline',
		'white-space': 'normal',
		color: 'rgb(63, 63, 63)',
		'margin-bottom': '8px'
	},
	'ul.nc-list_li': {
		'border-width': '0px',
		'border-style': 'none',
		'border-color': 'initial',
		'font-variant-numeric': 'inherit',
		'font-variant-east-asian': 'inherit',
		'font-stretch': 'inherit',
		'font-size': '15px',
		'line-height': '26px',
		'font-family': FONT_FAMILY,
		'list-style-position': 'outside',
	},
	'ul.nc-list_li_p': {
		'border-width': '0px',
		'border-style': 'initial',
		'border-color': 'initial',
		'font-family': 'inherit',
		'vertical-align': 'baseline',
		margin: '10px 0'
	},
	'ol.nc-list': {
		'padding-left': '1.5em',
		'border-width': '0px',
		'border-style': 'initial',
		'border-color': 'initial',
		'font-variant-numeric': 'inherit',
		'font-variant-east-asian': 'inherit',
		'font-stretch': 'inherit',
		'font-size': '15px',
		'line-height': '26px',
		'font-family': FONT_FAMILY,
		'vertical-align':' baseline',
		'white-space': 'normal',
		color: 'rgb(63, 63, 63)',
		'margin-bottom': '8px'
	},
	'ol.nc-list_li': {
		'border-width': '0px',
		'border-style': 'none',
		'border-color': 'initial',
		'font-variant-numeric': 'inherit',
		'font-variant-east-asian': 'inherit',
		'font-stretch': 'inherit',
		'font-size': '15px',
		'line-height': '1.75',
		'font-family': FONT_FAMILY,
		'list-style-position': 'outside'
	},
	'ol.nc-list_li_p': {
		'border-width': '0px',
		'border-style': 'initial',
		'border-color': 'initial',
		font: 'inherit',
		'vertical-align': 'baseline',
		margin: '10px 0'
	},
}

const sun_blue = {
	h1: {
		...commonStyles.h1,
		padding: 0,
		color: 'black',
		'margin-left': 0
	},
	h2: {
		...commonStyles.h2,
		'padding-left': '10px',
		color: '#595959',
		'text-align': 'left',
		'margin-left': 0,
		'border-left': '5px solid #19a9d7'
	},
	/* 三级标题样式 */
	h3: {
		...commonStyles.h3,
		padding: 0,
		color: '#595959',
		'text-align': 'center',
		'border-bottom': '2px solid #19a9d7',
		width: 'fit-content',
		'margin-left': 'auto',
		'margin-right': 'auto',
	},
	hr: {
		margin: '15px 0',
		'border-style': 'solid',
		'border-width': '1px 0 0',
		'border-color': '#19a9d7',
		'-webkit-transform-origin': '0 0',
		'-webkit-transform': 'scale(1, 1)',
		'transform-origin': '0 0',
		transform: 'scale(1, 1)'
	},
	/* 图片样式 */
	'figure.figure_img': {
		'border-radius': '8px',
	},
	/* 引用样式 */
	'blockquote.js-blockquote-wrap': {
		...commonStyles["blockquote.js-blockquote-wrap"],
		display: 'block',
		'font-size': '15px',
		overflow: 'auto',
		'padding-top': '10px',
		'padding-bottom': '10px',
		'padding-left': '20px',
		'padding-right': '10px',
		'margin-bottom': '20px',
		'margin-top': '20px',
		'font-weight': '400',
		'border-radius': '6px',
		color: '#595959',
		'font-style': 'normal',
		'text-align': 'left',
		'box-sizing': 'inherit',
		'border': '1px solid #19a9d7',
		'background': '#f2f8f8',
	},
	'blockquote.js-blockquote-wrap_section.js-blockquote-digest': {},
	/* 引用段落样式 */
	'blockquote.js-blockquote-wrap_section.js-blockquote-digest_p': {
		color: '#595959',
		'padding-top': '8px',
		'padding-bottom': '8px',
		margin: 0,
		'line-height': '26px',
		'font-family': FONT_FAMILY,
		'font-size': '14px'
	},
	/* 粗体样式 */
	'span.strong': {
		...commonStyles["span.strong"],
		color: '#19a9d7',
		'font-weight': 600
	},
	'span.inlineCode': {
		...commonStyles['span.inlineCode'],
		color: '#19a9d7',
	},
	a: {
		'text-decoration': 'none',
		color: '#19a9d7',
		'border-bottom': '1px solid #5698c3',
	},
	'a.no-link': {
		'text-decoration': 'none',
		'border-bottom': 'none',
		color: '#19a9d7',
	},
	p_span: {
		'text-decoration': 'none',
		color: '#19a9d7',
		'border-bottom': '1px solid #5698c3',
		'word-break': 'break-all'
	},
	p_sup: {
		color: '#19a9d7',
		'line-height': 0,
		'font-weight': 'bold'
	},
	'section.styled-callout': {
		...commonStyles["section.styled-callout"],
		'background-color': '#f2f8f8',
		'border-bottom': '1px dashed #19a9d7',
		'border-right': '1px dashed #19a9d7',
	},
	'section.styled-callout_section.header-wrapper': {},
	'section.styled-callout_section.header-wrapper_section.styled-callout-header': {
		width: '90%',
		'padding-right': '10px',
		'padding-left': '10px',
		'border-style': 'solid',
		'border-width': '1px 0 0 10px',
		'border-color': '#19a9d7'
	},
	'section.styled-callout_section.wechat-callout-block': commonStyles["section.styled-callout_section.wechat-callout-block"],
	output: {
		'background-image': 'linear-gradient(90deg, rgba(25, 169, 215, 0.09) 3%, rgba(0, 0, 0, 0) 3%), linear-gradient(360deg, rgba(25, 169, 215, 0.09) 3%, rgba(0, 0, 0, 0) 3%)',
		'background-size': '20px 20px',
		'background-position': 'center center',
	},
	reference: {
		background: '#f2f8f8',
		padding: '20px 20px 20px 20px',
		'font-size': '15px',
		'border-radius': '6px',
		border: '1px solid #19a9d7',
		'font-family': FONT_FAMILY
	}
}

const grace_green = {
	h1: {
		...commonStyles.h1,
		'padding-top': '16px',
		'padding-bottom': '10px',
		color: 'black',
		'border-bottom': '1px solid #9bd719',
		width: '100%',
		'text-align': 'left'
	},
	/* 二级标题样式 */
	h2: {
		...commonStyles.h2,
		padding: 0,
		color: 'black',
		width: 'fit-content',
		'margin-left': 0,
		background: "linear-gradient(#fff 60%, #9bd719 40%)"
	},
	/* 三级标题样式 */
	h3: {
		...commonStyles.h3,
		'padding-left': '20px',
		color: '#515151',
		'border-left': '3px solid #9bd719',
	},
	/* 四级标题样式 */
	hr: {
		margin: '15px 0',
		'border-style': 'solid',
		'border-width': '1px 0 0',
		'border-color': '#9bd719',
		'-webkit-transform-origin': '0 0',
		'-webkit-transform': 'scale(1, 1)',
		'transform-origin': '0 0',
		transform: 'scale(1, 1)'
	},
	/* 图片样式 */
	'figure.figure_img': {
		'border-radius': '8px',
	},
	/* 引用样式 */
	'blockquote.js-blockquote-wrap': {
		...commonStyles["blockquote.js-blockquote-wrap"],
		display: 'block',
		'font-size': '15px',
		overflow: 'auto',
		'padding-top': '10px',
		'padding-bottom': '10px',
		'padding-left': '20px',
		'padding-right': '10px',
		'margin-bottom': '20px',
		'margin-top': '20px',
		'font-weight': '400',
		color: '#6a737d',
		'border-left': '3px solid #9bd719',
		'background': '#f5f7ef',
	},
	'blockquote.js-blockquote-wrap_section.js-blockquote-digest': {},
	'blockquote.js-blockquote-wrap_section.js-blockquote-digest_p': {
		color: '#595959',
		padding: 0,
		margin: 0,
		'line-height': '26px',
		'font-family': FONT_FAMILY,
	},
	'span.strong': {
		...commonStyles['span.strong'],
		color: '#9bd719',
		'font-weight': 600
	},
	'span.inlineCode': {
		...commonStyles['span.inlineCode'],
		color: '#9bd719',
	},
	a: {
		'text-decoration': 'none',
		color: '#9bd719',
		'border-bottom': '1px solid #9bd719',
	},
	'a.no-link': {
		color: '#9bd719',
		'text-decoration': 'none',
		'border-bottom': 'none'
	},
	p_span: {
		'text-decoration': 'none',
		color: '#9bd719',
		'word-break': 'break-all',
		'border-bottom': '1px solid #9bd719',
	},
	p_sup: {
		color: '#9bd719',
		'line-height': 0,
		'font-weight': 'bold'
	},
	'section.styled-callout': {
		...commonStyles['section.styled-callout'],
		'background-color': '#f5f7ef',
		'border-bottom': '1px dashed #9bd719',
		'border-right': '1px dashed #9bd719',
	},
	'section.styled-callout_section.header-wrapper': {},
	'section.styled-callout_section.header-wrapper_section.styled-callout-header': {
		width: '90%',
		'padding-right': '10px',
		'padding-left': '10px',
		'border-style': 'solid',
		'border-width': '1px 0 0 10px',
		'border-color': '#9bd719'
	},
	'section.styled-callout_section.wechat-callout-block': commonStyles["section.styled-callout_section.wechat-callout-block"],
}

const simple_grey = {
	h1: {
		...commonStyles.h1,
		padding: '6px',
		width: 'fit-content',
		color: '#392313',
		'background-color': '#f2f2f2'
	},
	h2: {
		...commonStyles.h2,
		'padding-left': '10px',
		color: '#392313',
		'text-align': 'left',
		'margin-left': 0,
		'border-left': '5px solid #392313'
	},
	h3: {
		...commonStyles.h3,
		width: '100%',
		padding: 0,
		color: '#392313',
	},
	hr: {
		margin: '15px 0',
		'border-style': 'solid',
		'border-width': '1px 0 0',
		'border-color': '#a0a0a0',
		'-webkit-transform-origin': '0 0',
		'-webkit-transform': 'scale(1, 1)',
		'transform-origin': '0 0',
		transform: 'scale(1, 1)'
	},
	'figure.figure_img': {
		'border-radius': '8px',
	},
	'blockquote.js-blockquote-wrap': {
		...commonStyles["blockquote.js-blockquote-wrap"],
		position: 'relative',
		display: 'block',
		'font-size': '15px',
		overflow: 'auto',
		padding: '8px 12px 12px 12px',
		'margin-bottom': '20px',
		'margin-top': '20px',
		'font-weight': '400',
		'border-radius': '6px',
		'font-style': 'normal',
		'box-sizing': 'inherit',
		'background': '#f2f2f2',
		'border-left': 0
	},
	'blockquote.js-blockquote-wrap_section.js-blockquote-digest': {},
	'blockquote.js-blockquote-wrap_section.js-blockquote-digest_p': {
		color: '#595959',
		margin: 0,
		'line-height': '26px',
		'font-family': FONT_FAMILY,
		'font-size': '14px'
	},
	'blockquote.js-blockquote-wrap_span.begin-quote': {
		position: 'absolute',
		top: '2px',
		left: '6px',
		color: '#c6c7ca',
		'font-size': '34px',
		'line-height': 1,
		'font-weight': '700',
		opacity: 0.6
	},
	'blockquote.js-blockquote-wrap_span.end-quote': {
		float: 'right',
		color: '#c6c7ca',
		'font-size': '34px',
		'line-height': 1,
		'font-weight': '700',
		opacity: 0.6
	},
	'span.strong': {
		...commonStyles['span.strong'],
		color: '#392313',
		'font-weight': 600
	},
	a: {
		'text-decoration': 'none',
		color: '#392313',
		'border-bottom': '1px solid #392313',
	},
	'a.no-link': {
		color: '#392313',
		'text-decoration': 'none',
		'border-bottom': 'none'
	},
	'span.inlineCode': {
		...commonStyles['span.inlineCode'],
		color: '#392313',
	},
	p_span: {
		'text-decoration': 'none',
		color: '#392313',
		'border-bottom': '1px solid #392313',
		'word-break': 'break-all'
	},
	p_sup: {
		color: '#392313',
		'line-height': 0,
		'font-weight': 'bold'
	},
	'section.styled-callout': {
		...commonStyles['section.styled-callout'],
		padding: '16px',
		margin: '10px 0',
		'background-color': '#f2f2f2',
	},
	'section.styled-callout_section.header-wrapper': {
		display: 'none'
	},
	'section.styled-callout_section.wechat-callout-block': {
		...commonStyles["section.styled-callout_section.wechat-callout-block"],
		padding: '10px 4px',
		'border-top': '1px solid #a0a0a0',
		'border-bottom': '1px solid #a0a0a0',
	},
	'section.styled-callout_section.wechat-callout-block_p': {
		color: '#888888'
	},
}

const wood = {
	h1: {
		...commonStyles.h1,
		width: 'fit-content',
		color: 'white',
		display: 'flex',
		'align-items': 'center'
	},
	'h1_span': {
		'background-image': 'url(https://new-notion-1315843248.cos.ap-guangzhou.myqcloud.com/theme/wood/h1/bg2.svg)',
		'background-repeat': 'no-repeat',
		'background-position': 'center',
		padding: '0 10px',
	},
	'h1_section.left': {
		'background-image': 'url(https://new-notion-1315843248.cos.ap-guangzhou.myqcloud.com/theme/wood/h1/bg1.svg) ',
		'background-repeat': 'no-repeat',
		'background-size': 'cover',
		width: '10px',
		height: '40px',
	},
	'h1_section.right': {
		'background-image': 'url(https://new-notion-1315843248.cos.ap-guangzhou.myqcloud.com/theme/wood/h1/bg1.svg) ',
		'background-repeat': 'no-repeat',
		'background-size': 'cover',
		width: '10px',
		height: '40px',
	},
	h2: {
		...commonStyles.h2,
		display: 'flex',
		color: '#5a361a',
		'text-align': 'left',
		'margin-left': 0,
		width: 'fit-content',
		'align-items': 'center'
	},
	'h2_section.left': {
		'background-image': 'url(https://new-notion-1315843248.cos.ap-guangzhou.myqcloud.com/theme/wood/h1/bg1.svg) ',
		'background-repeat': 'no-repeat',
		'background-size': 'contain',
		width: '10px',
		height: '30px',
		'margin-right': '12px'
	},
	'h2_section.right': {
		'background-image': 'url(https://new-notion-1315843248.cos.ap-guangzhou.myqcloud.com/theme/wood/h1/bg1.svg) ',
		'background-repeat': 'no-repeat',
		'background-size': 'contain',
		width: '10px',
		height: '30px',
		'margin-left': '12px'
	},
	h3: {
		...commonStyles.h3,
		color: '#5a361a',
		width: 'fit-content',
		display: 'flex',
		'align-items': 'center'
	},
	'h3_section.left': {
		'background-image': 'url(https://new-notion-1315843248.cos.ap-guangzhou.myqcloud.com/theme/wood/h3/left.svg) ',
		'background-repeat': 'no-repeat',
		'background-size': 'cover',
		width: '25px',
		height: '25px',
		'margin-top': '-10px',
		'margin-right': '-2px',
	},
	'h3_section.right': {
		'background-image': 'url(https://new-notion-1315843248.cos.ap-guangzhou.myqcloud.com/theme/wood/h3/right.svg) ',
		'background-repeat': 'no-repeat',
		'background-size': 'cover',
		width: '25px',
		height: '25px',
		'margin-bottom': '-10px',
		'margin-left': '-2px',
	},
	hr: {
		margin: '15px 0',
		'border-style': 'solid',
		'border-width': '1px 0 0',
		'border-color': '#5a361a',
		'-webkit-transform-origin': '0 0',
		'-webkit-transform': 'scale(1, 1)',
		'transform-origin': '0 0',
		transform: 'scale(1, 1)'
	},
	/* 引用样式 */
	'blockquote.js-blockquote-wrap': {
		...commonStyles["blockquote.js-blockquote-wrap"],
		position: 'relative',
		display: 'block',
		'font-size': '15px',
		overflow: 'auto',
		padding: '24px 12px 12px',
		'margin-bottom': '20px',
		'margin-top': '20px',
		'font-weight': '400',
		'border-radius': '6px',
		'font-style': 'normal',
		'box-sizing': 'inherit',
		'background': '#f3e2cc',
		'background-image': 'url(https://new-notion-1315843248.cos.ap-guangzhou.myqcloud.com/theme/wood/blockquote/quote.svg) ',
		'background-repeat': 'no-repeat',
		'background-size': '22px',
		'background-position': '5px 5px',
		'border-left': 0,
	},
	'blockquote.js-blockquote-wrap_section.js-blockquote-digest': {},
	'blockquote.js-blockquote-wrap_section.js-blockquote-digest_p': {
		color: '#595959',
		margin: 0,
		'line-height': '26px',
		'font-family': FONT_FAMILY,
		'font-size': '14px'
	},
	'blockquote.js-blockquote-wrap_span.begin-quote': {
		position: 'absolute',
		top: '2px',
		left: '6px',
		color: '#c6c7ca',
		'font-size': '34px',
		'line-height': 1,
		'font-weight': '700',
		opacity: 0.6
	},
	'blockquote.js-blockquote-wrap_span.end-quote': {
		float: 'right',
		color: '#c6c7ca',
		'font-size': '34px',
		'line-height': 1,
		'font-weight': '700',
		opacity: 0.6
	},
	'span.strong': {
		...commonStyles['span.strong'],
		color: '#5a361a',
		'font-weight': 600
	},
	'span.inlineCode': {
		...commonStyles['span.inlineCode'],
		color: '#5a361a',
	},
	a: {
		'text-decoration': 'none',
		color: '#5a361a',
		'border-bottom': '1px solid #5a361a',
	},
	'a.no-link': {
		color: '#5a361a',
		'text-decoration': 'none',
		'border-bottom': 'none'
	},
	p_span: {
		'text-decoration': 'none',
		color: '#5a361a',
		'border-bottom': '1px solid #5a361a',
		'word-break': 'break-all'
	},
	p_sup: {
		color: '#5a361a',
		'line-height': 0,
		'font-weight': 'bold'
	},
	'figure.figure_img': {
		'border-radius': '8px',
	},
	'ul.nc-list': {
		...commonStyles["ul.nc-list"],
		'padding-left': '0.8em'
	},
	'ul.nc-list_li': {
		...commonStyles["ul.nc-list_li"],
		'padding-left': '20px',
		'list-style': 'none',
		'background-image': 'url(https://new-notion-1315843248.cos.ap-guangzhou.myqcloud.com/theme/wood/ul/li.svg) ',
		'background-repeat': 'no-repeat',
		'background-size': '12px',
		'background-position': '0 5px'
	},
	'section.styled-callout': {
		...commonStyles['section.styled-callout'],
		'background-color': '#f3e2cc',
		'border-bottom': '1px dashed #5a361a',
		'border-right': '1px dashed #5a361a',
	},
	'section.styled-callout_section.wechat-callout-block': commonStyles["section.styled-callout_section.wechat-callout-block"],
	'section.styled-callout_section.header-wrapper': {},
	'section.styled-callout_section.header-wrapper_section.styled-callout-header': {
		width: '90%',
		'padding-right': '10px',
		'padding-left': '10px',
		'border-style': 'solid',
		'border-width': '1px 0 0 10px',
		'border-color': '#5a361a'
	},
}
/*
* 不要修改下面定义的样式代码
* */
const themes = {
	default: {
		h1: {
			...commonStyles.h1,
			'text-align':'center',
			color: 'rgb(63,63,63)',
		},
		h2: {
			...commonStyles.h2,
			'margin-left': 0,
			'text-align':'left',
			color: 'rgb(63,63,63)',
		},
		h3: {
			...commonStyles.h3,
			'text-align':'left',
			color: 'rgb(63,63,63)',
		},
		hr: {
			'border-style': 'solid',
			'border-width': '1px 0 0',
			'border-color': '#797979',
			'-webkit-transform-origin': '0 0',
			'-webkit-transform': 'scale(1, 0.5)',
			'transform-origin': '0 0',
			transform: 'scale(1, 0.5)'
		},
		p: commonStyles.p,
		'span.strong': {
			...commonStyles['span.strong'],
			'font-weight': '600',
			color: 'rgb(63,63,63)'
		},
		'span.italic': {
			'font-style': 'italic',
		},
		'span.inlineCode': {
			...commonStyles['span.inlineCode'],
			color: '#EB5757',
		},
		a: {
			...commonStyles.a,
			color: 'rgb(63,63,63)'
		},
		p_span: commonStyles.p_span,
		p_a_span: commonStyles.a_span,
		'blockquote.js-blockquote-wrap': {
			...commonStyles["blockquote.js-blockquote-wrap"],
			hyphens: 'auto',
			cursor: 'text',
			'border-left': '3px solid rgb(63,63,63)',
			'font-size': '15px',
			padding: '4px 0 4px 10px',
			margin: '1em 0',
			'font-family': FONT_FAMILY,
			color: 'rgb(119,119,119)'
		},
		'blockquote.js-blockquote-wrap_section.js-blockquote-digest': {},
		'blockquote.js-blockquote-wrap_section.js-blockquote-digest_p': {
			margin: 0
		},
		'a.no-link': {
			...commonStyles['a.no-link'],
			color: 'rgb(63,63,63)',
		},
		pre: commonStyles.pre,
		'section.callout': {
			'margin-top': '10px',
			'margin-bottom': '10px',
			padding: '10px',
			'white-space': 'normal',
			outline: 0,
			'background-color': 'rgb(242, 242, 242)',
			'font-family': FONT_FAMILY
		},
		'ul.nc-list': {
			...commonStyles["ul.nc-list"],
			color: 'rgb(63,63,63)',
		},
		'ul.nc-list_li': commonStyles["ul.nc-list_li"],
		'ul.nc-list_li_p': commonStyles["ul.nc-list_li_p"],
		'ol.nc-list': {
			...commonStyles['ol.nc-list'],
			color: 'rgb(63,63,63)',
		},
		'ol.nc-list_li': commonStyles["ol.nc-list_li"],
		'ol.nc-list_li_p': commonStyles["ol.nc-list_li_p"],
		'figure.figure_img': {
			'border-radius': '0'
		},
		'section.wechat-callout-wrapper': {
			'margin-top': '20px',
			'margin-bottom': '20px',
			display: 'flex',
			padding: '10px',
			'border-radius': '8px',
			'line-height': '26px',
			'background-color': 'rgb(247,247,247)',
			border: 'none',
			color: 'rgb(119,119,119)'
		},
		'section.wechat-callout-wrapper_div': {},
		'section.wechat-callout-wrapper_div_span': {},
		'section.wechat-callout-wrapper_section.callout': {
			'white-space': 'normal',
			'outline': 0,
			'font-family': FONT_FAMILY,
			'margin-left': '10px'
		},
		'section.wechat-callout-wrapper_section.callout_div.wechat-callout-block': {},
		'section.wechat-callout-wrapper_section.callout_div.wechat-callout-block_p': {},
		'section.styled-callout_section.wechat-callout-block_p': {
			color: '#37352f'
		},
		reference: {
			'font-family': FONT_FAMILY
		}
	},
	pineapple_red: {
		h1: {
			...commonStyles.h1,
			color: '#fc7930',
			'text-align':'center',
			padding:'0 1em',
			'border-bottom':'2px solid rgba(252, 121, 48, 1)',
		},
		h2: {
			...commonStyles.h2,
			background :'#fc7930',
			color: '#FFFFFF',
			'text-align': 'center',
			padding: '0 0.2em',
		},
		h3: {
			...commonStyles.h3,
			color: '#000000',
			'padding-left': '8px',
			'border-left': '3px solid rgba(252, 121, 48, 1)',
		},
		/* 图片样式 */
		'figure.figure_img': {
			'border-radius': '8px'
		},
		/* 引用样式 */
		'blockquote.js-blockquote-wrap': {
			...commonStyles["blockquote.js-blockquote-wrap"],
			hyphens: 'auto',
			'text-align': 'left',
			outline: 0,
			margin: '1em 0',
			'max-width': '100%!important',
			'border-top': 'none',
			'border-right': 'none',
			'border-bottom': 'none',
			display: 'block',
			overflow: 'auto',
			padding: '1px 10px 1px 20px',
			'margin-bottom': '20px',
			'margin-top': '20px',
			'border-left': '3px solid rgba(247, 207, 186, 1)',
			background: 'none',
			'border-radius': 'none',
			'font-family': FONT_FAMILY
		},
		'blockquote.js-blockquote-wrap_section.js-blockquote-digest': {},
		'blockquote.js-blockquote-wrap_section.js-blockquote-digest_p': {
			color:'#808A87',
			'font-family': FONT_FAMILY,
			'font-size': '14px'
		},
		'span.strong': {
			...commonStyles['span.strong'],
			color: '#fc7930',
			'font-weight': '600'
		},
		'span.inlineCode': {
			...commonStyles['span.inlineCode'],
			color: '#fc7930',
		},
		a: {
			'text-decoration': 'none',
			color: '#fc7930',
			'border-bottom': '1px solid #fc7930',
		},
		'a.no-link': {
			color: '#fc7930',
			'text-decoration': 'none',
			'border-bottom': 'none'
		},
		p_span: {
			color: '#fc7930',
      'word-break': 'break-all',
			'border-bottom': '1px solid #fc7930',
		},
		p_sup: {
      color: '#fc7930',
      'line-height': 0,
      'font-weight': 'bold'
		},
		'ul.nc-list': {
			...commonStyles["ul.nc-list"],
			color: '#fc7930',
		},
		'ul.nc-list_li_p': {
			...commonStyles["ul.nc-list_li_p"],
			color: 'black'
		},
		'section.styled-callout': {
			...commonStyles['section.styled-callout'],
			'background-color': '#fff',
			'border-bottom': '1px dashed #fc7930',
			'border-right': '1px dashed #fc7930',
		},
		'section.styled-callout_section.header-wrapper': {},
		'section.styled-callout_section.wechat-callout-block': commonStyles["section.styled-callout_section.wechat-callout-block"],
		'section.styled-callout_section.header-wrapper_section.styled-callout-header': {
			width: '90%',
			'padding-right': '10px',
			'padding-left': '10px',
			'border-style': 'solid',
			'border-width': '1px 0 0 10px',
			'border-color': '#fc7930'
		},
	},
	simple_blue: {
		h1: {
			...commonStyles.h1,
			color: '#5296d4',
			'text-align':'center',
			padding:'0 1em',
			'border-bottom':'2px solid rgba(123, 183, 224)',
		},
		h2: {
			...commonStyles.h2,
			background :'#5296d4',
			color: '#FFFFFF',
			'text-align': 'center',
			padding: '0 0.2em',
		},
		h3: {
			...commonStyles.h3,
			color: '#000000',
			'padding-left': '8px',
			'border-left': '3px solid rgba(123, 183, 224)',
		},
		'figure.figure_img': {
			'border-radius': '8px',
		},
		'blockquote.js-blockquote-wrap': {
			...commonStyles["blockquote.js-blockquote-wrap"],
			hyphens: 'auto',
			'text-align': 'left',
			outline: 0,
			margin: '1em 0',
			'max-width': '100%!important',
			'border-top': 'none',
			'border-right': 'none',
			'border-bottom': 'none',
			display: 'block',
			overflow: 'auto',
			padding: '1px 10px 1px 20px',
			'margin-bottom': '20px',
			'margin-top': '20px',
			'border-left': '3px solid rgba(195, 215, 223)',
			background: 'none',
			'border-radius': 'none',
			'font-family': FONT_FAMILY
		},
		'blockquote.js-blockquote-wrap_section.js-blockquote-digest': {},
		'blockquote.js-blockquote-wrap_section.js-blockquote-digest_p': {
			color:'#808A87',
			'font-family': FONT_FAMILY,
			'font-size': '14px'
		},
		'span.strong': {
			...commonStyles['span.strong'],
			color: '#5296d4',
			'font-weight': 600
		},
		'span.inlineCode': {
			...commonStyles['span.inlineCode'],
			color: '#5296d4',
		},
		a: {
			'text-decoration': 'none',
			color: '#5296d4',
			'border-bottom': '1px solid #5296d4',
		},
		'a.no-link': {
			color: '#5296d4',
			'text-decoration': 'none',
			'border-bottom': 'none'
		},
		p_span: {
			color: '#5296d4',
      'word-break': 'break-all',
			'border-bottom': '1px solid #5296d4',
		},
		p_sup: {
      color: '#5296d4',
      'line-height': 0,
      'font-weight': 'bold'
		},
		p_a_span: {
			'border-bottom': '0.05em solid',
			'border-color': 'rgba(82,150,212,0.4)',
		},
		'ul.nc-list': {
			...commonStyles["ul.nc-list"],
			color: '#5296d4',
		},
		'ul.nc-list_li_p': {
			...commonStyles["ul.nc-list_li_p"],
			color: 'black'
		},
		'section.styled-callout': {
			...commonStyles['section.styled-callout'],
			'background-color': '#fff',
			'border-bottom': '1px dashed #5296d4',
			'border-right': '1px dashed #5296d4',
		},
		'section.styled-callout_section.header-wrapper': {},
		'section.styled-callout_section.wechat-callout-block': commonStyles["section.styled-callout_section.wechat-callout-block"],
		'section.styled-callout_section.header-wrapper_section.styled-callout-header': {
			width: '90%',
			'padding-right': '10px',
			'padding-left': '10px',
			'border-style': 'solid',
			'border-width': '1px 0 0 10px',
			'border-color': '#5296d4'
		},
	},
	tech_black: {
		h1: {
			...commonStyles.h1,
			color: '#222222',
			'text-align':'center',
			padding:'0 1em',
			'border-bottom':'8px solid #222222',
		},
		h2: {
			...commonStyles.h2,
			color: '#222222',
			'text-align': 'center',
			padding: '0 0.2em',
		},
		h3: {
			...commonStyles.h3,
			color: '#222222',
			'text-align': 'left',
		},
		'blockquote.js-blockquote-wrap': {
			...commonStyles["blockquote.js-blockquote-wrap"],
			hyphens: 'auto',
			'text-align': 'left',
			outline: 0,
			margin: '1em 0',
			'max-width': '100%!important',
			'border-top': 'none',
			'border-right': 'none',
			'border-bottom': 'none',
			display: 'block',
			overflow: 'auto',
			padding: '10px',
			'margin-bottom': '20px',
			'margin-top': '20px',
			'border-left': '8px solid #222222',
			'background-color': '#f5f5f5',
			'border-radius': 'none',
			'font-family': FONT_FAMILY
		},
		'blockquote.js-blockquote-wrap_section.js-blockquote-digest': {},
		'blockquote.js-blockquote-wrap_section.js-blockquote-digest_p': {},
		'figure.figure_img': {
			'border-radius': '10px'
		},
		a: {
			'text-decoration': 'none',
			color: '#222222',
			'border-bottom': '1px solid #222222',
		},
		'a.no-link': {
			color: '#222222',
			'text-decoration': 'none',
			'border-bottom': 'none'
		},
		'span.inlineCode': {
			...commonStyles['span.inlineCode'],
			color: '#222222',
		},
		p_span: {
			color: '#222222',
      'word-break': 'break-all',
			'border-bottom': '1px solid #222222',
		},
		'section.styled-callout': {
			...commonStyles['section.styled-callout'],
			'background-color': '#fff',
			'border-bottom': '1px dashed #222222',
			'border-right': '1px dashed #222222',
		},
		'section.styled-callout_section.header-wrapper': {},
		'section.styled-callout_section.wechat-callout-block': commonStyles["section.styled-callout_section.wechat-callout-block"],
		'section.styled-callout_section.header-wrapper_section.styled-callout-header': {
			width: '90%',
			'padding-right': '10px',
			'padding-left': '10px',
			'border-style': 'solid',
			'border-width': '1px 0 0 10px',
			'border-color': '#222222'
		},
	},
	pie: {
		h1: {
			...commonStyles.h1,
			'border-left': '6px solid #F22F27',
			'padding-left': '6px',
			'margin-left': 0
		},
		h2: {
			...commonStyles.h2
		},
		h3: {
			...commonStyles.h3
		},
		hr: {
			margin: '15px 0',
			'border-style': 'solid',
			'border-width': '1px 0 0',
			'border-color': '#f22f27',
			'-webkit-transform-origin': '0 0',
			'-webkit-transform': 'scale(1, 1)',
			'transform-origin': '0 0',
			transform: 'scale(1, 1)'
		},
		'figure.figure_img': {
			'border-radius': '8px',
		},
		'blockquote.js-blockquote-wrap': {
			...commonStyles["blockquote.js-blockquote-wrap"],
			position: 'relative',
			padding: '24px 16px 12px',
			margin: '24px 0 36px',
			'text-indent': '0',
			border: 'none',
			'border-left': '2px solid rgba(242,47,39)',
			'font-family': PIE_FAMILY,
			'background': 'url(https://new-notion-1315843248.cos.ap-guangzhou.myqcloud.com/theme/pie/pie_blockquote.svg)',
			'background-repeat': 'no-repeat',
			'background-size': '12px',
			'background-position': '12px 0'
		},
		'blockquote.js-blockquote-wrap_section.js-blockquote-digest': {},
		'blockquote.js-blockquote-wrap_section.js-blockquote-digest_p': {
			color:'#8C8C8C',
			'font-family': PIE_FAMILY,
			'font-size': '14px'
		},
		/* 段落样式 */
		p: {
			'text-align':'left',
			'line-height':1.75,
			'font-family': PIE_FAMILY,
			margin:'10px 0',
			'letter-spacing':'0.1em',
			'margin-block': '10px',
			'white-space': 'normal',
			color: 'rgb(63, 63, 63)',
			'font-size': '14px'
		},
		'span.strong': {
			...commonStyles['span.strong'],
			color: '#f22f27',
			'font-weight': 600
		},
		'span.inlineCode': {
			...commonStyles['span.inlineCode'],
			color: '#f22f27',
		},
		a: {
			'text-decoration': 'none',
			color: '#f22f27',
			'border-bottom': '1px solid #f22f27',
		},
		'a.no-link': {
			color: '#f22f27',
			'text-decoration': 'none',
			'border-bottom': 'none'
		},
		p_span: {
			color: '#f22f27',
      'word-break': 'break-all',
			'border-bottom': '1px solid #f22f27',
		},
		p_sup: {
      color: '#f22f27',
      'line-height': 0,
      'font-weight': 'bold'
		},
		p_a_span: {
			'border-bottom': '0.05em solid',
			'border-color': '#f22f27',
		},
		'ul.nc-list': {
			...commonStyles["ul.nc-list"],
			'font-family': PIE_FAMILY,
			color: '#f22f27',
		},
		'ul.nc-list_li': {
			...commonStyles["ul.nc-list_li"],
			'font-family': PIE_FAMILY,
		},
		'ul.nc-list_li_p': {
			...commonStyles["ul.nc-list_li_p"],
			color: 'black'
		},
		'section.styled-callout': {
			...commonStyles['section.styled-callout'],
			'background-color': '#fff',
			'border-bottom': '1px dashed #f22f27',
			'border-right': '1px dashed #f22f27',
		},
		'section.styled-callout_section.header-wrapper': {},
		'section.styled-callout_section.wechat-callout-block': commonStyles["section.styled-callout_section.wechat-callout-block"],
		'section.styled-callout_section.header-wrapper_section.styled-callout-header': {
			width: '90%',
			'padding-right': '10px',
			'padding-left': '10px',
			'border-style': 'solid',
			'border-width': '1px 0 0 10px',
			'border-color': '#f22f27'
		},
	},
	sun_blue,
	grace_green,
	simple_grey,
	wood
}
