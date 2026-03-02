let notionTabId
chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
  if (message.type === 'enter') {
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true})
    notionTabId = tab.id
  }
})
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    chrome.tabs.create({url: "https://notion-converter.addpotion.com/#9829852cf5c34a6b91b1484ce1319473"})
  }
})

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === 'open-new-tab') {
    chrome.tabs.create({'url': chrome.runtime.getURL('options_page.html')})
  }
})

function setPopupForTab(tab) {
  const url = tab.url
  console.log('url', url)
  if (/https:\/\/.*\.notion.so\/.*/.test(url)) {
    chrome.action.setPopup({tabId: tab.id, popup: ''});
  } else {
    chrome.action.setPopup({tabId: tab.id, popup: 'popup.html'})
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  const url = tab.url
  if (/https:\/\/.*\.notion.so\/.*/.test(url)) {
    chrome.tabs.sendMessage(tab.id, {type: 'show-pop-content'})
  }
})

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const queryOptions = {active: true, lastFocusedWindow: true}
  const [currentTab] = await chrome.tabs.query(queryOptions)
  setPopupForTab(currentTab)
})