const axios = require('axios');

class API {
  created(config) {
    this.api = axios.create(config);
  }

  handleInterceptors() {
    this.api.interceptors.request.use((res) => {
      return res
    }, (err) => {
      return Promise.reject(err);
    });

    this.api.interceptors.response.use(async (res) => {
      return res
    }, (err) => {
      return Promise.reject(err);
    })
  }

  constructor(config) {
    this.created(config);
    this.handleInterceptors();
  }

  getInstance() {
    return this.api;
  }
}

const api = new API({
  baseURL: `https://api.poeditor.com/v2`
}).getInstance();

module.exports = api;
