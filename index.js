'use strict'

require('dotenv').config()

const ngrok = require('./get_public_url')
const ViberBot = require('viber-bot').Bot
const UrlMessage = require('viber-bot').Message.Url
const TextMessage = require('viber-bot').Message.Text
const RichMediaMessage = require('viber-bot').Message.RichMedia
const KeyboardMessage = require('viber-bot').Message.Keyboard
const BotEvents = require('viber-bot').Events
const winston = require('winston')

const SAMPLE_RICH_MEDIA = {
  // "ButtonsGroupColumns": 1,
  ButtonsGroupRows: 2,
  BgColor: '#FFFFFF',
  Buttons: [{
    ActionBody: 'https://chatgenie.ph',
    ActionType: 'open-url',
    OpenURLType: 'internal',
    InternalBrowser: {
      Mode: 'fullscreen'
    },
    BgColor: '#FFFFFF',
    Text: 'Chatgenie Page',
    Rows: 1
  }, {
    ActionBody: 'https://gorated.ph',
    ActionType: 'open-url',
    OpenURLType: 'internal',
    InternalBrowser: {
      Mode: 'fullscreen'
    },
    BgColor: '#FFFFFF',
    Text: 'Gorated Page',
    Rows: 1
  }]
}

const MENU = {
  ButtonsGroupRows: 1,
  BgColor: '#FFFFFF',
  Buttons: [{
    ActionBody: process.env.CHATGENIE_BOT_URL,
    ActionType: 'open-url',
    OpenURLType: 'internal',
    InternalBrowser: {
      Mode: 'fullscreen',
      ActionButton: 'none'
    },
    BgColor: '#FFFFFF',
    Text: 'Access Menu here',
    Rows: 1
  }]
}

// Reference: https://developers.viber.com/docs/tools/keyboards/
const GET_STARTED = {
  Type: 'keyboard',
  Revision: 1,
  Buttons: [
    {
      // "Columns": 1,
      Rows: 1,
      BgColor: '#e6f5ff',
      Text: 'Get Started',
      // "BgMedia": "http://www.jqueryscript.net/images/Simplest-Responsive-jQuery-Image-Lightbox-Plugin-simple-lightbox.jpg",
      // "BgMediaType": "picture",
      // "BgLoop": true,
      ActionType: 'reply',
      ActionBody: 'start'
    }
  ]
}

// Note: Opening links is not allowed
const PERSISTENT_MENUS = {
  Type: 'keyboard',
  Revision: 1,
  Buttons: [
    {
      Rows: 1,
      BgColor: '#e6f5ff',
      Text: 'Menu',
      ActionType: 'reply',
      ActionBody: 'menu'
    },
    {
      Rows: 1,
      BgColor: '#e6f5ff',
      Text: 'View Cart',
      ActionType: 'reply',
      ActionBody: 'cart'
    },
    {
      Rows: 1,
      BgColor: '#e6f5ff',
      Text: 'Order History',
      ActionType: 'reply',
      ActionBody: 'orderhistory'
    },
    {
      Rows: 1,
      BgColor: '#e6f5ff',
      Text: 'Powered by Chatgenie',
      ActionType: 'reply',
      ActionBody: 'chatgenie'
    }
  ]
}

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'bot.log' })
  ]
})

const bot = new ViberBot({
  logger: logger,
  authToken: process.env.VIBER_PUBLIC_ACCOUNT_ACCESS_TOKEN_KEY,
  name: 'I am a Chat Bot',
  avatar: 'http://viber.com/avatar.jpg' // It is recommended to be 720x720, and no more than 100kb.
})

bot.on(BotEvents.CONVERSATION_STARTED, (response, isSubscribed, context, onFinish) => {
  console.log('CONVERSATION_STARTED')
  console.log(response.userProfile)
  console.log(isSubscribed)
  // console.log(context); // undefined
  // console.log(onFinish); // undefined

  if (isSubscribed) {
    const message = new KeyboardMessage(PERSISTENT_MENUS)
    bot.sendMessage(response.userProfile, message)
  } else {
    const welcomeMessage = new TextMessage(`Hi, ${response.userProfile.name}! Nice to meet you!`)
    const message = new KeyboardMessage(GET_STARTED)
    bot.sendMessage(response.userProfile, welcomeMessage)
    bot.sendMessage(response.userProfile, message)
  }
})

bot.on(BotEvents.SUBSCRIBED, (response) => {
  console.log(response)
  response.send(new TextMessage(`Thanks for subscribing, ${response.userProfile.name}!`))
})

bot.on(BotEvents.MESSAGE_RECEIVED, (message, response) => {
  console.log(message)
  const messageText = message.text
  if (messageText === 'Hello' || messageText === 'Hello') {
    const message = new TextMessage('Hi!')
    bot.sendMessage(response.userProfile, message)
    return
  }
  if (messageText === 'webview') {
    const message = new UrlMessage('https://google.com')
    bot.sendMessage(response.userProfile, message)
    return
  }
  if (messageText === 'chatgenie') {
    bot.sendMessage(response.userProfile, new RichMediaMessage(SAMPLE_RICH_MEDIA))
    return
  }
  if (messageText === 'menu') {
    bot.sendMessage(response.userProfile, new RichMediaMessage(MENU))
  }
  if (messageText === 'start') {
    bot.sendMessage(response.userProfile, new KeyboardMessage(PERSISTENT_MENUS))
    return
  }
  // Default Action
  bot.sendMessage(response.userProfile, new KeyboardMessage(PERSISTENT_MENUS))
})

// Wasn't that easy? Let's create HTTPS server and set the webhook:
const http = require('http')
const port = process.env.PORT || 8080

// Viber will push messages sent to this URL. Web server should be internet-facing.
// const webhookUrl = process.env.WEBHOOK_URL

// Trusted SSL certification (not self-signed).
// const httpsOptions = {
// // key: ...,
// // cert: ...,
// // ca: ...
// };

// https.createServer(httpsOptions, bot.middleware()).listen(port, () => bot.setWebhook(webhookUrl));

ngrok.getPublicUrl().then(publicUrl => {
  console.log('Set the new webhook to ', publicUrl)
  console.log('Using Auth Token: ' + process.env.VIBER_PUBLIC_ACCOUNT_ACCESS_TOKEN_KEY)
  http.createServer(bot.middleware()).listen(port, () => bot.setWebhook(publicUrl))
}).catch(error => {
  console.log('Can not connect to ngrok server. Is it running?')
  console.error(error)
})
