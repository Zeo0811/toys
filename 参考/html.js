const themeSelect = `
<div class="custom-select">
  <button
    class="select-button"
    role="combobox"
    aria-labelledby="select button"
    aria-haspopup="listbox"
    aria-expanded="false"
    aria-controls="select-dropdown"
  >
    <span class="selected-value">选择主题</span>
    <span class="arrow"></span>
  </button>
  <ul class="select-dropdown" role="listbox" id="select-dropdown"></ul>
</div>
`

const functionButtons = `
  <div class="hstack gap-4 flex-grow-1" style="height: 40px;margin: auto 0">
    ${themeSelect}
    <div class="hstack font-value-area">
      <button type="button" class="btn active" value="default">默认字体</button>
      <button type="button" class="btn" value="PingFangThin">苹方</button>
      <button type="button" class="btn" value="Helvetica">Helvetica</button>
    </div>
    <div class="hstack font-size-area gap-2">
      <button type="button" class="btn decrease">A</button>
      <button type="button" class="btn increase">A</button>
    </div>
  </div>
`

const mainContainerAuxButtons = `
    <button type="button" id="refresh-btn" class="btn refresh-btn">
      <svg width="33" height="38" viewBox="0 0 33 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M31.8027 21.359H27.0588C26.4428 21.359 25.9684 21.8428 25.8976 22.4541C25.2721 27.8495 20.0821 31.8688 14.2997 30.5448C10.8916 29.7636 8.12309 26.9998 7.33716 23.5941C5.91397 17.4222 10.5871 11.9183 16.5206 11.9183V15.4585C16.5206 15.9353 16.8085 16.3672 17.2499 16.5489C17.6912 16.7307 18.1963 16.6292 18.5362 16.2917L25.6167 9.21116C26.077 8.75093 26.077 8.00275 25.6167 7.54252L18.5362 0.461988C18.1963 0.126843 17.6912 0.0253555 17.2499 0.207089C16.8085 0.388823 16.5206 0.820735 16.5206 1.29749V4.83775C7.33008 4.83775 -0.13044 12.3785 0.00172945 21.5997C0.126819 30.3654 7.50473 37.748 16.2704 37.8802C25.0762 38.0124 32.355 31.2151 32.997 22.6004C33.0466 21.9278 32.4777 21.359 31.8027 21.359Z" fill="var(--refresh-icon-color)"/>
      </svg>
    </button>
    <button id="copy-wechat-btn" class="btn">复制为公众号格式</button>
    <button id="copy-md-btn" class="btn">复制为Markdown</button>
`

const unableRenderTip = `
<div>
  <p>请检查文档里面是否有不支持的格式，重新调整您的文档，更多格式支持我们会尽快完善。如需帮助，<a href="https://notion-converter.addpotion.com/#97a24664ef1340adaef2dc0ff8132888" target="_blank">请反馈</a></p>
  <p>目前支持的格式：</p>
  <ol>
    <li>标题</li>
    <li>文本</li>
    <li>链接</li>
    <li>引用</li>
    <li>图片（仅单列和双列）</li>
    <li>有序列表</li>
    <li>无序列表</li>
    <li>分割线</li>
    <li>代码块</li>
    <li>Callout</li>
    <li>表格</li>
  </ol>
</div>
`

const mainContainer = `
    <div class="mask" id="loadingMask"><div>加载中...</div></div> 
    <div class="main-container">
      <div class="pop-content">
        <div class="function-area d-flex justify-content-between align-items-center">
          ${functionButtons}
        </div>
        <div class="spinner-border" role="status"></div>
        <div class="main-area"></div>
        <div>
          <div class="aux-area hstack align-items-center">
            <div class="left-area hstack gap-3">
              ${mainContainerAuxButtons}
            </div>
            <button type="button" class="ms-auto btn btn-light trigger-login-btn">登录</button>
          </div>
        </div>
      </div>
    </div>
`
const backBtn = `
    <button type="button" class="btn btn-light back-btn">
      <svg width="9.03" height="15.89" viewBox="0 0 11.0258296 17.8895165" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="设计" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">
          <g id="个人中心---VIP" transform="translate(-122.2371, -91.0552)" stroke="#B6B5B0" stroke-width="2">
              <polyline id="路径" points="132.262909 107.944746 123.237091 100 132.262909 92.0552543"></polyline>
          </g>
        </g>
      </svg>
    </button>
`

const loginForm = `
  <div class="row align-items-center">
    <div class="col text-center">
      <img src="${chrome.runtime.getURL('/imgs/N.png')}" width="68"/>
    </div>
  </div>
  <div class="row">
    <div class="text-center">
      <p class="h5" style="color: #37352f;">Notion Converter</p>
    </div>
  </div>
  <div class="row">
    <div class="text-center">
      <p style="color: #a3a29e;font-size: 15px">
        搭配精彩的模板，一键将Notion内容复制为公众号格式、<br/>或复制为Markdown文本。</p>
    </div>
  </div>
  <div class="row" style="padding-top: 45px">
    <form class="need-validation" novalidate>
      <div class="vstack gap-3 align-items-center">
        <div class="vstack-item">
          <div class="input-group has-validation">
            <input type="email" class="form-control email-input" id="email" placeholder="邮箱" required>
            <div class="invalid-feedback">
              请输入邮箱
            </div>
          </div>
        </div>
        <div class="vstack-item">
          <button type="submit" class="login-btn">登录</button>
        </div>
        <div class="vstack-item">
          <button type="button" class="register-btn">新用户注册</button>
        </div>
      </div>
    </form>
  </div>
`

function userInfoForm(email, vipWithEndAt){
  function vipBox(vipName, vipType) {
    const vipEnable = vipWithEndAt.hasOwnProperty(vipType)
    const className = vipEnable ? 'enable-vip-box' : 'disable-vip-box'
    const vipSvgColor = vipEnable ? '#07C160' : '#E1E1E1'
    const arrowSvgColor = vipEnable ? '#ffffff' : '#C4C4C4'
    const $vipBox = $(`
      <div class="${className} vip-box hstack gap-1">
        <div class="vip-name d-flex justify-content-between align-items-center">
          <span class="text-center">${vipName}</span>
          <svg width="26" height="12" viewBox="0 0 26 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M26 4.31894C26 3.63879 25.822 3.02494 25.4659 2.47748C25.1098 1.93023 24.6279 1.52365 24.0203 1.25786C23.4125 0.992179 22.525 0.859283 21.3578 0.859283H16.6754V11.7407H20.0888V7.78669H21.9922C23.2077 7.78669 24.1795 7.46783 24.9078 6.8301C25.6358 6.19237 26 5.35535 26 4.31894ZM20.0406 3.34647H21.2775C22.1931 3.34647 22.6509 3.68664 22.6509 4.36679C22.6509 5.08967 22.1555 5.45095 21.1651 5.45095H20.0406V3.34647Z" fill="${vipSvgColor}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.28118 6.79024C5.39959 7.14097 5.50448 7.48648 5.59594 7.82655L7.62193 0.859283H10.3888L6.98682 11.7407H3.55729L0 0.859283H3.54634L5.28118 6.79024Z" fill="${vipSvgColor}"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M14.764 11.7407H11.3988V0.859283H14.764V11.7407Z" fill="${vipSvgColor}"/>
          </svg>
        </div>
        <div class="vip-function gap-1 d-flex justify-content-center align-items-center"></div>
      </div> 
    `)

    if (vipEnable) {
      $vipBox.find('.vip-function').html(`<p class="purchase-btn">${vipWithEndAt[vipType]} 到期</p>`)
    } else {
      $vipBox.find('.vip-function').html(`
      <p class="purchase-btn">解锁</p>
      <svg width="5.2607665px" height="8.12064021px" viewBox="0 0 5.2607665 8.12064021" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="设计" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round" stroke-linejoin="round">
          <g id="个人中心---VIP" transform="translate(-443.9154, -522.5397)" stroke="${arrowSvgColor}" stroke-width="1.5">
              <polyline id="路径" points="444.66536 523.289689 448.426117 526.6 444.66536 529.910311"></polyline>
          </g>
        </g>
      </svg>
    `)
    }

    return $vipBox
  }
  const $html = $(`
    <div class="row align-items-center">
      <div class="col text-center">
        <img src="${chrome.runtime.getURL('/imgs/N.png')}" width="68"/>
      </div>
    </div>
    <div class="row">
      <div class="text-center">
        <p class="h5" style="color: #37352f;">Notion Converter</p>
      </div>
    </div>
    <div class="row">
      <div class="text-center">
        <p style="color: #a3a29e;font-size: 15px">
          搭配精彩的模板，一键将Notion内容复制为公众号格式、<br/>或复制为Markdown文本。</p>
      </div>
    </div>
    <div class="user-info vstack gap-2">
      <p class="text-center fw-bold" style="margin-top: 1em;font-size: 30px">${email}</p>
      <div class="vip-area vstack gap-2"></div>
    </div>
  ` )

  $html.find('.vip-area').append(vipBox('公众号', 'WECHAT'))
    .append(vipBox('Markdown', 'MD'))
  return $html
}

const loginFormLeftTips = `
  <p><a href="https://notion-converter.addpotion.com/#97a24664ef1340adaef2dc0ff8132888" class="link-dark text-decoration-none" target="_blank">反馈</a></p>
  <p><a href="https://notion-converter.addpotion.com/#fb7610fef23c408b9640125c3842250d" class="link-dark text-decoration-none" target="_blank">用户手册</a></p> 
`

function generateThemeOptions(vip) {
  const themeValues = ['默认主题', '菠萝红', '简约蓝', '科技黑', '少数派', '晴天蓝', '雅绿', '极简灰', '木工']
  const themeKeys = Object.keys(themes)
  return themeKeys.map((it, index) => {
    if (vip || it === 'default') {
      return `
        <li role="option">
          <input type="radio" />
          <label for="${it}">${themeValues[index]}</label>
        </li>
      `
    } else {
      return `
        <li role="option">
          <input type="radio" />
          <label for="${it}">
            <svg width="25" height="11" viewBox="0 0 25 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M24.11 3.27938C24.11 2.65433 23.9476 2.0902 23.6227 1.58709C23.2979 1.08417 22.8582 0.71053 22.3039 0.466269C21.7494 0.222106 20.9398 0.0999756 19.8749 0.0999756H15.6031V10.1H18.7172V6.46623H20.4537C21.5626 6.46623 22.4491 6.17319 23.1135 5.58713C23.7778 5.00106 24.11 4.23184 24.11 3.27938ZM18.6733 2.38568H19.8016C20.6369 2.38568 21.0546 2.69831 21.0546 3.32336C21.0546 3.98768 20.6027 4.31969 19.6991 4.31969H18.6733V2.38568Z" fill="#FFCE00"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M5.20817 5.5505C5.31619 5.87282 5.41188 6.19033 5.49532 6.50286L7.34364 0.0999756H9.86783L6.76423 10.1H3.63546L0.390137 0.0999756H3.62547L5.20817 5.5505Z" fill="#FFCE00"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M13.8593 10.1H10.7892V0.0999756H13.8593V10.1Z" fill="#FFCE00"/>
            </svg>
            ${themeValues[index]}
          </label>
        </li>
      `
    }
  }).join('\n')
}

function renderFormLeftTips() {
  $('.aux-area .left-area').removeClass('gap-1').addClass('gap-5')
    .html(loginFormLeftTips)
    .after(`<button type="button" class="btn logout-btn">登出</button>`)
}

const returnThemePreviewBtn = `
  <button class="btn return-theme-preview-btn">退出示例主题预览</button>
`
