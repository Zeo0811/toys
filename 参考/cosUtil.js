async function getCosImageUrl(src, compress = true) {
  const imgUrl = await notionCache.get(src).then(res=>res[src]);
  if (imgUrl) {
    return imgUrl;
  }

  const imgFormat = src.substring(src.lastIndexOf('.') + 1);
  const suffix = imgFormat.startsWith('gif') ? 'gif' : 'jpg'
  return new Promise((resolve, reject) => {
    uploadCos(src, 'wechat', suffix).then(res => {
      if (compress) {
        if (imgFormat.startsWith('gif')) {
          notionCache.set({ [src]: res })
          resolve(res)
        } else {
          notionCache.set({[src]: `${res}?imageMogr2/format/webp`})
          resolve(`${res}?imageMogr2/format/webp`)
        }
      } else {
        notionCache.set({[src]: res})
        resolve(res)
      }
    }).catch(err => {
      resolve(chrome.runtime.getURL('imgs/loading.gif'))
    })
  })
}

function uploadCos(url, bucketDir, suffix) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    // 加载时处理
    xhr.onload = function (_) {
      if (this.status === 200) {
        const fileName = `${generateUUID()}.${suffix}`
        const formData = new FormData()
        formData.append("file", this.response)
        $.ajax({
          type: 'POST',
          url: `${domain}/api/uploadObject?fileName=${fileName}&bucketDir=${bucketDir}`,
          data: formData,
          cache: false,
          processData: false,
          contentType: false,
          success: function (res) {
            resolve(res)
          },
          error: function () {
            reject(new Error('upload error'))
          }
        });
      } else {
        reject(new Error('upload error'))
      }
    }
    xhr.send();
  })
}
