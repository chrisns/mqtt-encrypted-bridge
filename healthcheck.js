const request = require('request')

request('http://localhost:3000', error => {
  if (error) {
    throw error
  }
})