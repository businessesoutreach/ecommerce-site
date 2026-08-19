const axios = require('axios');

const STORAGE_BASE = (process.env.INTEGRATION_PROXY_URL || '').trim() || 'https://integrations.emergentagent.com';
const STORAGE_URL = STORAGE_BASE.replace(/\/$/, '') + '/objstore/api/v1/storage';
const EMERGENT_KEY = process.env.EMERGENT_LLM_KEY;
const APP_NAME = 'solekicks';

let storage_key = null;

async function initStorage(force = false) {
    if (storage_key && !force) {
        return storage_key;
    }
    try {
        const resp = await axios.post(`${STORAGE_URL}/init`, { emergent_key: EMERGENT_KEY }, { timeout: 30000 });
        storage_key = resp.data.storage_key;
        return storage_key;
    } catch (err) {
        console.error('Storage init failed:', err.message);
        throw err;
    }
}

async function putObject(path, data, contentType) {
    let key = await initStorage();
    try {
        const resp = await axios.put(`${STORAGE_URL}/objects/${path}`, data, {
            headers: {
                'X-Storage-Key': key,
                'Content-Type': contentType
            },
            timeout: 120000
        });
        return resp.data;
    } catch (err) {
        if (err.response && err.response.status === 404) {
            key = await initStorage(true);
            const resp = await axios.put(`${STORAGE_URL}/objects/${path}`, data, {
                headers: {
                    'X-Storage-Key': key,
                    'Content-Type': contentType
                },
                timeout: 120000
            });
            return resp.data;
        }
        throw err;
    }
}

async function getObject(path) {
    const key = await initStorage();
    const resp = await axios.get(`${STORAGE_URL}/objects/${path}`, {
        headers: { 'X-Storage-Key': key },
        timeout: 60000,
        responseType: 'arraybuffer'
    });
    return {
        data: resp.data,
        contentType: resp.headers['content-type'] || 'application/octet-stream'
    };
}

module.exports = {
    APP_NAME,
    initStorage,
    putObject,
    getObject
};
