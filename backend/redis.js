require('dotenv').config()

const Redis = require('ioredis')
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
})

module.exports = redis
