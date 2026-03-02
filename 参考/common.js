let notionExtractor
let globalTheme = 'default'
let vip = false
const domain = 'https://688868168.xyz'
const localDomain = 'http://localhost:8081'
// const domain = localDomain

  async function setSaToken(satoken) {
  chrome.storage.local.set({satoken}).then(() => {
    console.log(`set satoken: ${satoken} success`);
  })
}

async function getHeader() {
  const result = await chrome.storage.local.get(["satoken"])
  return {
    satoken: result.satoken
  }
}

async function getUserEmailAndVip() {
  return new Promise(async (resolve, reject) => {
    $.ajax({
      type: 'get',
      url: `${domain}/api/User/userInfo`,
      contentType: 'application/json',
      headers: {
        ...await getHeader()
      },
      success: async function (res) {
        const data = res.data
        if (data) {
          // 登录信息放入缓存
          await notionCache.setLoginData(data);

          chrome.storage.local.set({user: data}).then(() => {
            console.log(`set user info`);
            const vip = Object.keys(data.vipWithEndAt).length > 0
            resolve({email: data.email, vip, vipWithEndAt: data.vipWithEndAt})
          })
        } else {
          resolve(undefined)
        }
      },
      error: function () {
        reject(new Error('服务器开小差了'))
      }
    })
  })
}

function setUserStatus(vip, email) {
  $('.trigger-login-btn').remove()
  $('.avatar').remove()
  if (vip) {
    $('.aux-area').append(`
      <div class="avatar d-flex align-items-center justify-content-center position-relative ms-auto">
        <span>${email.substring(0, 3)}</span>
        <div class="badge vip-badge fw-bold position-absolute">
          <svg width="25" height="11" viewBox="0 0 25 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M24.11 3.27938C24.11 2.65433 23.9476 2.0902 23.6227 1.58709C23.2979 1.08417 22.8582 0.71053 22.3039 0.466269C21.7494 0.222106 20.9398 0.0999756 19.8749 0.0999756H15.6031V10.1H18.7172V6.46623H20.4537C21.5626 6.46623 22.4491 6.17319 23.1135 5.58713C23.7778 5.00106 24.11 4.23184 24.11 3.27938ZM18.6733 2.38568H19.8016C20.6369 2.38568 21.0546 2.69831 21.0546 3.32336C21.0546 3.98768 20.6027 4.31969 19.6991 4.31969H18.6733V2.38568Z" fill="white"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.20817 5.5505C5.31619 5.87282 5.41188 6.19033 5.49532 6.50286L7.34364 0.0999756H9.86783L6.76423 10.1H3.63546L0.390137 0.0999756H3.62547L5.20817 5.5505Z" fill="white"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M13.8593 10.1H10.7892V0.0999756H13.8593V10.1Z" fill="white"/>
          </svg>
        </div>
      </div> 
    `)
  } else {
    $('.aux-area').append(`
      <div class="avatar d-flex align-items-center justify-content-center position-relative ms-auto">
        <span>${email.substring(0, 3)}</span>
        <div class="badge free-badge fw-bold position-absolute">
          <svg width="28" height="9" viewBox="0 0 28 9" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M21.6233 0.0999756H27.6433V1.94617H24.0324V3.10664H26.9516V4.88239H24.0324V6.18937H27.6433V8.09998H21.6233V0.0999756Z" fill="white"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M14.8236 0.0999756H20.8436V1.94617H17.2328V3.10664H20.1519V4.88239H17.2328V6.18937H20.8436V8.09998H14.8236V0.0999756Z" fill="white"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M10.1525 5.04066L11.3212 8.09998H14.044L12.5961 4.61286C13.1666 4.34326 13.5458 4.03165 13.7333 3.67805C13.9209 3.32445 14.0147 2.9171 14.0147 2.45608C14.0147 1.74888 13.7597 1.17942 13.2497 0.747629C12.7398 0.315912 12.0236 0.0999756 11.1013 0.0999756H6.922V8.09998H9.378V5.04066H10.1525ZM9.378 1.79965H10.5093C11.1385 1.79965 11.4531 2.05563 11.4531 2.56742C11.4531 2.81752 11.3593 3.00697 11.1717 3.13594C10.9841 3.26483 10.7359 3.32931 10.4273 3.32931H9.378V1.79965Z" fill="white"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M2.74841 3.30588H5.35681V5.10515H2.74841V8.09998H0.356812V0.0999756H6.14229V2.00478H2.74841V3.30588Z" fill="white"/>
          </svg>
        </div>
      </div> 
    `)
  }
}

async function onPay(price, vipType) {
  const myModal = new bootstrap.Modal(document.getElementById('qrcodeModal'))
  $('.price').html(
      `请使用<span style="color: red; font-weight: bold;">支付宝</span>支付${price}元（支付完可以通过点击浏览器右上角固定插件按钮查看个人会员状态，如果长时间未生效请联系我们，微信:warmwater_8）`)
  myModal.show()
  $.ajax({
    type: 'post',
    url: `${domain}/api/pay`,
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify({
      price,
      vipType
    }),
    headers: {
      ...await getHeader()
    },
    success: function (res) {
      if (res.data) {
        const src = `https://xorpay.com/qr?data=${res.data}`
        $('.qrcode').attr('src', src)
      } else if (res.errorMessage) {
        console.error(res.errorMessage)
      }
    },
    error: function () {
      alert('服务器开小差了')
    }
  })
}

async function logout() {
  await chrome.storage.local.remove('satoken')
  localStorage.clear()
  await notionCache.clearLoginData();
}

function getThemeName(themeValue) {
  const themeValues = ['默认主题', '菠萝红', '简约蓝', '科技黑', '少数派', '晴天蓝', '雅绿', '极简灰', '木工']
  const themeKeys = Object.keys(themes)
  const index = themeKeys.indexOf(themeValue)
  return themeValues[index]
}