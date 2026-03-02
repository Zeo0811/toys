// noinspection JSUnresolvedVariable,JSJQueryEfficiency
// noinspection JSUnresolvedReference

chrome.runtime.sendMessage({type: 'enter'});
$('body').append(mainContainer)

$('#notion-app').on('click', function () {
  sliceOutContent()
  $('.mask').hide()
})

// 阻止键盘事件冒泡，对notion造成影响
$('.main-container').on('keydown keyup keypress paste copy cut', function (event) {
  event.stopPropagation();
});

let wechatRender
async function switchPopContent() {
  const $popContent = $('.pop-content')
  const displayAttr = $popContent.css('display')
  if (displayAttr === 'none') {
    wechatRender = new WechatRender()
    $('.main-container').show()
    showMask()
    $popContent.css({
      display: 'flex',
      animation: 'sliceIn 0.3s ease-in-out'
    })
    const preference = await getPreference()
    if (preference.hasOwnProperty('fontFamily')) {
      $(`.font-value-area .btn[value=${preference.fontFamily}]`).addClass('active')
        .siblings()
        .removeClass('active')
    }
    try {
      getUserEmailAndVip(); // 为了检查会员到期状态
      const userInfo = await notionCache.getLoginData()
      if (userInfo) {
        const {email, vip: localVip} = userInfo
        setUserStatus(localVip, email)
        $('.main-container .avatar').css('pointer-event', 'none')
        vip = localVip
        if (vip && preference.hasOwnProperty('theme')) {
          globalTheme = preference.theme
        }
      } else {
        vip = false
        globalTheme = 'default'
      }
      $('.mask').hide()
      await renderMainContent()
      $('.main-container').find('button,input,select').removeAttr('disabled')
      $('.main-container .avatar').css('pointer-event', 'auto')
      const event = {
        event: 'OpenExtension',
        properties: {}
      }
      await trackEvent(event)
    } catch (e) {
      console.trace(e)
    }
  } else {
    sliceOutContent()
  }
}

async function copyToClipboard(content, type) {
  const waitToCopyHtmlBlob = new Blob([content], {
    type
  });
  await navigator.clipboard.write(
    [new ClipboardItem({[type]: waitToCopyHtmlBlob})])
  const readResult = await navigator.clipboard.read()
  for (const clipBoardItems of readResult) {
    for (const type of clipBoardItems.types) {
      const blob = await clipBoardItems.getType(type)
      const reader = new FileReader();
      reader.readAsText(blob, 'utf-8');
      reader.onload = function (e) {
        console.log(`type: ${type}, text: ${reader.result}`)
      }
    }
  }
}

$('.aux-area').on('click', '.return-theme-preview-btn', async function () {
  globalTheme = 'default'
  $('.aux-area .left-area .return-theme-preview-btn').remove()
  $('.aux-area .left-area').append(mainContainerAuxButtons)
  $('.custom-select .select-button .selected-value').text('默认主题')
  await renderResultHtml()
})

$('.aux-area').on('click', '#copy-wechat-btn', async function () {
  const $renderContent = $('.output')
  console.log('render html', $renderContent[0].outerHTML)
  await copyToClipboard($renderContent[0].outerHTML, 'text/html');
  $('#copy-wechat-btn').text('复制成功')
    .addClass('copy-success-btn')

  setTimeout(function () {
    $('#copy-wechat-btn').removeClass('copy-success-btn')
      .text('复制为公众号格式')
  }, 1500)
  const event = {
    event: 'CopyToWechat',
    properties: {
      theme: globalTheme,
      fontValue: $('.font-value-area .active:eq(0)').attr('value')
    }
  }
  await trackEvent(event)
})

$('.aux-area').on('click', '#copy-md-btn', async function () {
  $('#copy-md-btn').text('复制中...')
  $.ajax({
    url: `${domain}/api/User/checkPermission?operation=COPY_MD`,
    type: 'get',
    headers: {
      ...await getHeader()
    },
    success: async function (res) {
      if (res.data) {
        const parsedTree = parser.parse($(".notion-page-content").html(), false)
        const content = await markdownRender.render(parsedTree)
        console.log('render markdown', content)
        await copyToClipboard(content, 'text/plain')
        $('#copy-md-btn').text('复制成功')
          .addClass('copy-success-btn')
        const event = {
          event: 'CopyToMarkdown',
          properties: {}
        }
        await trackEvent(event)
      } else {
        $('#copy-md-btn').text('请升级会员')
      }
      setTimeout(function () {
        $('#copy-md-btn').removeClass('copy-success-btn')
          .text('复制为Markdown')
      }, 1500)
    }
  })
})

$('.aux-area').on('click', '#refresh-btn', async function () {
  await renderResultHtml()
})

$('.aux-area').on('click', '.avatar', async function () {
  if ($('.mask').css('display') === 'none' && $('.main-container').find('.form-area').length === 0) {
    renderFormLeftTips()
    $('.main-container .avatar').css('pointer-event', 'none')
    $('.function-area').html(backBtn)
      .append('<span style="margin-right: 240px;font-size: 20px;color: #B6B5B0">个人中心</span>')
    showMask()
    try {
      const {email, vipWithEndAt} = await getUserEmailAndVip()
      $('.main-area').html(userInfoForm(email, vipWithEndAt))
        .removeClass('main-area')
        .addClass('form-area')
    } catch (e) {
      console.error(e.message)
    } finally {
      $('.mask').css('display', 'none')
      $('.main-container button').removeAttr('disabled')
      $('.main-container a').css('pointer-event', 'auto')
      $('.main-container .avatar').css('pointer-event', 'auto')
    }
  }
})

$('.aux-area').on('click', '.logout-btn', async function () {
  vip = false
  globalTheme = 'default'
  await logout()
  $('.form-area').removeClass('form-area')
    .addClass('main-area')
  await renderMainContent()
  $('.avatar').remove()
  $('.aux-area .left-area').after(`<button type="button" class="ms-auto btn btn-light trigger-login-btn">登录</button>`)
})
$('.aux-area').on('click', '.trigger-login-btn', function () {
  $('.function-area').html(backBtn)
  $('.main-area').html(loginForm)
    .removeClass('main-area')
    .addClass('form-area')
  $('.aux-area .left-area').removeClass('gap-1').addClass('gap-5')
    .html(loginFormLeftTips)
})

$('.function-area').on('click', '.custom-select', function () {
  $('.custom-select').toggleClass('active')
  $('.select-button').attr('aria-expanded', $('.select-button').attr('aria-expanded') === 'true' ? 'false' : 'true')
})
$('.function-area').on('click', '.select-dropdown li', async function (e) {
  e.stopPropagation()
  $('.custom-select').removeClass('active')
  const selectedTheme = $($(this).find('label')[0]).attr('for')
  globalTheme = selectedTheme
  $('.custom-select .select-button .selected-value').html($(this).find('label')[0].innerHTML)
  await savePreference({theme: selectedTheme})
  await renderResultHtml()
})

$('.function-area').on('click', '.back-btn', function () {
  $('.form-area').removeClass('form-area')
    .addClass('main-area')
  renderMainContent()
})
$('.function-area').on('click', '.font-value-area .btn', async function () {
  const $this = $(this)
  if (!$this.hasClass('active')) {
    $this.siblings().removeClass('active')
    $this.addClass('active')
  }
  const value = $(this).attr('value')
  wechatRender.setFont(value, $('.output'))
  await savePreference({fontFamily: value})
})

$('.function-area').on('click', '.decrease', async function () {
  const preference = await getPreference()
  let fontValue
  if (preference.hasOwnProperty('fontSize')) {
    const fontSize = preference.fontSize
    fontValue = parseInt(fontSize.replace('px', '')) - 1
  } else {
    fontValue = 14
  }
  wechatRender.setFontSize(`${fontValue}px`, $('.output'))
  await savePreference({fontSize: `${fontValue}px`})
  if (fontValue <= 14) {
    $(this).addClass('disabled')
  }
  $('.increase').removeClass('disabled')
})

$('.function-area').on('click', '.increase', async function () {
  const preference = await getPreference()
  let fontValue
  if (preference.hasOwnProperty('fontSize')) {
    const fontSize = preference.fontSize
    fontValue = parseInt(fontSize.replace('px', '')) + 1
  } else {
    fontValue = 14
  }
  wechatRender.setFontSize(`${fontValue}px`, $('.output'))
  await savePreference({fontSize: `${fontValue}px`})
  if (fontValue >= 17) {
    $(this).addClass('disabled')
  }
  $('.decrease').removeClass('disabled')
})

$('.main-area').on('submit', 'form', function(event) {
  event.preventDefault()
  event.stopPropagation()
  const form = $('.main-container form')[0]
  const $loginBtn = $('.login-btn')
  const $registerBtn = $('.confirm-register-btn')
  if (!form.checkValidity()) {
    form.classList.add('was-validated')
  } else {
    $loginBtn.attr('disabled', 'disabled')
    $registerBtn.attr('disabled', 'disabled')
    $.ajax({
      type: 'post',
      url: `${domain}/api/User/login`,
      contentType: 'application/json',
      data: JSON.stringify({email: $('#email').val(), password: ''}),
      success: async function (res) {
        const data = res.data
        // 登录信息放入缓存
        await notionCache.setLoginData(data);

        const localVip = Object.keys(data.vipWithEndAt).length > 0
        vip = localVip
        await setSaToken(res.data.saTokenInfo.tokenValue)
        setUserStatus(localVip, data.email)
        renderFormLeftTips()
        $('.form-area').html(userInfoForm(data.email, data.vipWithEndAt))
      },
      error: function () {
        alert('服务器开小差了')
        $loginBtn.removeAttr('disabled')
        $registerBtn.removeAttr('disabled')
      }
    })
  }
})

$('.main-area').on('click', '.register-btn', function () {
  $('.login-btn').addClass('confirm-register-btn')
    .removeClass('login-btn')
    .text('确认注册')
  $('.register-btn').remove()
  $('.main-area form').removeClass('was-validated')
})
$('.main-area').on('click', '.purchase-btn', function () {
  chrome.runtime.sendMessage({type: 'open-new-tab'});
})

async function savePreference(option) {
  let result = await chrome.storage.local.get(['preference'])
  console.log('preference in save', result.preference)
  if (result.preference) {
    result.preference = Object.assign(result.preference, option)
  } else {
    result.preference = Object.assign({}, option)
  }
  await chrome.storage.local.set({preference: result.preference})
}

async function getPreference() {
  const result = await chrome.storage.local.get(['preference'])
  if (result.preference) {
    return result.preference
  } else {
    return {}
  }
}

async function renderResultHtml() {
  const $renderContent = $('.main-area')
  $renderContent.html('')
  $('.spinner-border').show()
  const useTemplatePost = !vip && globalTheme !== 'default'
  let parsedTree
  if (useTemplatePost) {
    parsedTree = templatePostParsedTree
  } else {
    // 对于某些使用notion搭博客的博客文章的解析
    if ($('.notion-page-content').find('.notion-transclusion_container-block').length !== 0) {
      parsedTree = parser.parse($('.notion-transclusion_container-block').children().children()[1].innerHTML, true)
    } else {
      parsedTree = parser.parse($(".notion-page-content").html(), true)
    }
  }
  const $wechatOutput = await wechatRender.render(parsedTree)
  if (useTemplatePost) {
    $('.aux-area .left-area').children().remove()
    $('.aux-area .left-area').append(returnThemePreviewBtn)
  }
  $wechatOutput.children(':first-child').css('margin-top', 0)
  const fontValue = $('.font-value-area .active:eq(0)').attr('value')
  wechatRender.setFont(fontValue, $wechatOutput)
  const preference = await getPreference()
  if (preference.hasOwnProperty('fontSize')) {
    wechatRender.setFontSize(preference.fontSize, $wechatOutput)
  }
  $renderContent.html($wechatOutput[0])
  $('.spinner-border').hide()
}

async function renderThemeOptions() {
  const options = generateThemeOptions(vip)
  // 没有会员权限的话，无法设置select的值，因为option是disable，手动设置成default
  $('.custom-select .select-dropdown').html(options)
  $('.custom-select .select-button .selected-value').text(getThemeName(globalTheme))
}

chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  if (message.type === 'show-pop-content') {
    await switchPopContent()
  }
});

async function renderMainContent() {
  $('.function-area').html(functionButtons)
  await renderThemeOptions()
  $('.aux-area .left-area').removeClass('gap-5').addClass('gap-1')
    .html(mainContainerAuxButtons)
  $('.logout-btn').remove()
  await renderResultHtml()
}

function sliceOutContent() {
  const $popContent = $('.pop-content')
  $popContent.css({
    animation: 'sliceOut 0.3s linear'
  })
  setTimeout(() => {
    $('.form-area').addClass('main-area')
      .removeClass('form-area')
    $popContent.css('display', 'none')
    $('.main-container').hide()
  }, 200)
}

function showMask() {
  $('.mask').css({
    display: 'flex',
    animation: 'sliceIn 0.3s ease-in-out'
  })
  $('.main-container button').attr('disabled', 'true')
  $('.main-container a').css('pointer-event', 'none')
}

