const axios = require('axios');
module.exports = () => {
    const api = axios.create({
        baseURL: 'https://osu.ppy.sh/api/',
        headers: {'X-Custom-Header': 'foobar'}
      });
    
    return api;
}