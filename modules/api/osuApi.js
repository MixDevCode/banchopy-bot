const axios = require('axios');
const botConfig = require('../../config.json')
module.exports = () => {
    const api = axios.create({
        baseURL: botConfig.server.apiurl,
        headers: {'X-Custom-Header': 'foobar'}
      });
    return api;
}