const notionCache = {
    /**
     * 缓存
     * @param {Object} params { [key: string]: any; }
     * @returns 
     */
    async set(params) {
        return chrome.storage.sync.set(params);
    },

    /**
     * 缓存中取值
     * @param {any} keys string | string[] | { [key: string]: any; } | null * 
     * @returns 
     */
    async get(keys) {
        return chrome.storage.sync.get(keys);
    },

    /**
     * 删除中取值
     * @param {any} keys string | string[]
     * @returns 
     */
    async remove(keys) {
        return chrome.storage.sync.remove(keys);
    },

    async setLoginData(loginData) {
        return this.set({'LOGIN_DATA': {...loginData, vip: Object.keys(loginData.vipWithEndAt).length > 0 } });
    },

    async getLoginData() {
        const loginData = await this.get('LOGIN_DATA');
        if (Object.keys(loginData).length == 0) {
            return
        }
        return loginData['LOGIN_DATA'];
    },

    async clearLoginData() {
        return chrome.storage.sync.remove('LOGIN_DATA');
    },
};

// 防止历史脚本报错
const imageCache = {};