'use strict';

const path = require('path');

module.exports = (dualspace, options) => {
  const angular = window.angular = {};
  let angularBootstrapReal;
  window.addEventListener("load", function (event) {

    let axios = require('electron').remote.require('axios');
    let download_entry = document.querySelector('body > div.main > div > div.panel.give_me > div.download_entry.ng-scope > a')
    if (download_entry) download_entry.click();
    (function init() {
      console.log('start init')
      let retObj = {}
      window.BOT = {
        glue: {
          // will be initialized by glueToAngular() function
        },
        emit: require('events'),  // send event to Node.js
        ipcRenderer: require('electron').ipcRenderer,
        // glue funcs
        // , getLoginStatusCode: function() { returnwindow.BOT.glue.loginScope.code }
        // , getLoginQrImgUrl:   function() { returnwindow.BOT.glue.loginScope.qrcodeUrl }

        angularIsReady: function angularIsReady() {
          // don't log inside, because we has not yet init clog here.
          return !!(
            (typeof angular) !== 'undefined'
            && angular.element
            && angular.element('body')
            && angular.element(document).injector()
          )
        },

        // variable
        vars: {
          loginState: false,
          initState: false,

          scanCode: null,
          heartBeatTimmer: null,
        },

        // funcs
        log: function log(text) {
          window.BOT.emit('log', text)
        },
        /**
         *
        * Functions that Glued with AngularJS
        *
        */
        MMCgiLogined: function MMCgiLogined() {
          return !!(window.MMCgi && window.MMCgi.isLogin)
        },


        heartBeat: function heartBeat(firstTime) {
          var TIMEOUT = 15000 // 15s
          if (firstTime && window.BOT.vars.heartBeatTimmer) {
            window.BOT.log('heartBeat timer exist when 1st time is true? return for do nothing')
            return
          }
          window.BOT.ding('heartbeat@browser')
          window.BOT.vars.heartBeatTimmer = setTimeout(heartBeat, TIMEOUT)
          return TIMEOUT
        },

        glueToAngular: function glueToAngular() {
          var injector = angular.element(document).injector()
          if (!injector) {
            throw new Error('glueToAngular cant get injector(right now)')
          }

          var accountFactory = injector.get('accountFactory')
          var appFactory = injector.get('appFactory')
          var chatroomFactory = injector.get('chatroomFactory')
          var chatFactory = injector.get('chatFactory')
          var contactFactory = injector.get('contactFactory')
          var confFactory = injector.get('confFactory')
          var emojiFactory = injector.get('emojiFactory')
          var loginFactory = injector.get('loginFactory')
          var utilFactory = injector.get('utilFactory')

          var http = injector.get('$http')
          var state = injector.get('$state')
          var mmHttp = injector.get('mmHttp')

          var appScope = angular.element('[ng-controller="appController"]').scope()
          var rootScope = injector.get('$rootScope')
          var loginScope = angular.element('[ng-controller="loginController"]').scope()

          /*
              // method 1
              appFactory.syncOrig = appFactory.sync
              appFactory.syncCheckOrig = appFactory.syncCheck
              appFactory.sync = function() {window.BOT.log('appFactory.sync() !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); return appFactory.syncOrig(arguments) }
              appFactory.syncCheck = function() {window.BOT.log('appFactory.syncCheck() !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); return appFactory.syncCheckOrig(arguments) }
              // method 2
              $.ajaxOrig = $.ajax
              $.ajax = function() {window.BOT.log('$.ajax() !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); return $.ajaxOrig(arguments) }
              $.ajax({
              url: "https://wx.qq.com/zh_CN/htmledition/v2/images/webwxgeticon.jpg"
              , type: "GET"
              }).done(function (response) {
              alert("success");
              })
              // method 3 - mmHttp
              mmHttp.getOrig = mmHttp.get
              mmHttp.get = function() {window.BOT.log('mmHttp.get() !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); return mmHttp.getOrig(arguments) }
          */

          /**
           * generate $scope with a contoller (as it is not assigned in html staticly)
           * https://github.com/angular/angular.js/blob/a4e60cb6970d8b6fa9e0af4b9f881ee3ba7fdc99/test/ng/controllerSpec.js#L24
           */
          var contentChatScope = rootScope.$new()
          injector.get('$controller')('contentChatController', { $scope: contentChatScope })

          // get all we need from wx in browser(angularjs)
          window.BOT.glue = {
            injector,
            http,
            mmHttp,
            state,

            accountFactory,
            chatroomFactory,
            chatFactory,
            confFactory,
            contactFactory,
            emojiFactory,
            loginFactory,
            utilFactory,

            rootScope,
            appScope,
            loginScope,

            contentChatScope,
          }

          return true
        },

        checkScan: function checkScan() {
          //window.BOT.log('checkScan()')
          if (window.BOT.loginState()) {
            window.BOT.log('checkScan() - already login, no more check, and return(only)') //but I will emit a login event')
            // window.BOT.login('checkScan found already login')
            return
          }

          const loginScope = window.BOT.glue.loginScope
          if (!loginScope) {
            window.BOT.log('checkScan() - loginScope disappeared, TODO: find out the reason why this happen')
            // window.BOT.login('loginScope disappeared')
            // return
            return setTimeout(checkScan, 1000)
          }

          // loginScope.code:
          // 0:   ???????�
          // 408: ??�????????????30??????
          // 201: ?????????
          // 200: ??????
          var code = +loginScope.code
          var url = loginScope.qrcodeUrl
          window.BOT.log('checkScan() code:' + code + ' url:' + url + ' scanCode:' + window.BOT.vars.scanCode)

          if (url && code !== window.BOT.vars.scanCode) {
            window.BOT.log('checkScan() - code change detected: from '
              + window.BOT.vars.scanCode
              + ' to '
              + code
              + ' url'
              + url
            )
            window.BOT.emit('scan', {
              code: code,
              url: url,
            })
            window.BOT.vars.scanCode = code
          }

          if (code !== 200) {
            return setTimeout(checkScan, 1000)
          }

          window.BOT.vars.scanCode = null
          loginScope.code = null

          // wait a while because the account maybe blocked by tencent,
          // then there will be a dialog should appear
          setTimeout(() => window.BOT.login('scan code 200'), 1000)
          return
        },

        loginState: function loginState(state) {
          if (typeof state === 'undefined') {
            return !!BOT.vars.loginState
          }
          window.BOT.vars.loginState = state
          return
        },

        login: function login(data) {
          console.log(data)

          window.BOT.log('login(' + data + ')')
          window.BOT.loginState(true)
          window.BOT.emit('login', data)
        },

        logout: function logout(data) {
          window.BOT.log('logout(' + data + ')')

          window.BOT.loginState(false)

          //window.BOT.emit('logout', data)
          if (window.BOT.glue.loginFactory) {
            window.BOT.glue.loginFactory.loginout(0)
          } else {
            window.BOT.log('logout()window.BOT.glue.loginFactory NOT found')
          }

          setTimeout(() => window.BOT.checkScan(), 1000)
        },

        ding: function ding(data) {
          window.BOT.log('recv ding')
          return data || 'dong'
        },
        ask: function ask(info, options = {}, answer = this.answer) {
          options.key = '5acbb7225a154ad38843a54f9cfdb8e5'
          options.info = info;
          return axios.get('http://www.tuling123.com/openapi/api', {
            params: options
          })
        },
        hookEvents: function hookEvents() {
          var shell = require('electron').shell
          var rootScope = window.BOT.glue.rootScope
          var appScope = window.BOT.glue.appScope
          if (!rootScope || !appScope) {
            window.BOT.log('hookEvents() no rootScope')
            return false
          }
          rootScope.$on('message:add:success', function (event, data) {
            if (!window.BOT.loginState()) { // in case of we missed the pageInit event
              window.BOT.login('by event[message:add:success]')
            }
            console.log(data)

            if (data.ToUserName == window.BOT.getUserName() //我接收的消息
              && !data.FromUserName.startsWith('@@')//不是群消息
              && data.MsgType == 1
            ) {
              window.BOT.ask(data.MMActualContent, { userid: data.ToUserName }).then(function (r) {
                // console.log(r.data)
                // console.log('bot', 'Talker reply:"%s" for "%s" ',
                //     r.data.text,
                //     data.MMActualContent
                // )
                window.BOT.send(data.FromUserName, r.data.text)
              })

            }
          })
          rootScope.$on('root:pageInit:success'), function (event, data) {
            window.BOT.login('by event[root:pageInit:success]')
          }
          // newLoginPage seems not stand for a user login action
          // appScope.$on("newLoginPage", function(event, data) {
          //   window.BOT.login('by event[newLoginPage]')
          // })
          window.addEventListener('unload', function (e) {
            // XXX only 1 event can be emitted here???
            window.BOT.emit('unload', String(e))
            window.BOT.log('event unload')
          })
          return true
        },

        hookRecalledMsgProcess: function hookRecalledMsgProcess() {
          var chatFactory = window.BOT.glue.chatFactory
          var utilFactory = window.BOT.glue.utilFactory
          var confFactory = window.BOT.glue.confFactory

          // hook chatFactory._recalledMsgProcess, resolve emit RECALLED type msg
          let oldRecalledMsgProcess = chatFactory._recalledMsgProcess
          chatFactory._recalledMsgProcess = function (msg) {
            oldRecalledMsgProcess(msg)
            var m = Object.assign({}, msg)
            var content = utilFactory.htmlDecode(m.MMActualContent)
            content = utilFactory.encodeEmoji(content)
            var revokemsg = utilFactory.xml2json(content).revokemsg
            if (revokemsg.msgid) {
              var chatMsgs = chatFactory.getChatMessage(m.MMPeerUserName)
              var i = chatFactory._findMessageByMsgId(chatMsgs, revokemsg.msgid)
              if (i > -1) {
                m = chatMsgs[i]
                m.MsgType = confFactory.MSGTYPE_RECALLED
              } else {
                m.MsgId = revokemsg.msgid
                m.MMActualContent = m.Content = revokemsg.replacemsg.replace(/"/g, "")
              }
              window.BOT.emit('message', m)
            }
          }
        },

        /**
         *
         * Help Functions which Proxy to WXAPP AngularJS Scope & Factory
         *  getMsgImg(message.MsgId,'slave')
         *  getMsgImg(message.MsgId,'big',message)
         */
        getMsgImg: function getMsgImg(id, type, message) {
          var contentChatScope = window.BOT.glue.contentChatScope
          if (!contentChatScope) {
            throw new Error('getMsgImg() contentChatScope not found')
          }
          var path = contentChatScope.getMsgImg(id, type, message)
          return window.location.origin + path
          // https://wx.qq.com/?&lang=en_US/cgi-bin/mmwebwx-bin/webwxgetmsgimg?&MsgID=4520385745174034093&skey=%40crypt_f9cec94b_a3aa5c868466d81bc518293eb292926e
          // https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetmsgimg?&MsgID=8454987316459381112&skey=%40crypt_f9cec94b_bd210b2224f217afeab8d462af70cf53
        },

        getMsgEmoticon: function getMsgEmoticon(id) {
          var chatFactory = window.BOT.glue.chatFactory

          var message = chatFactory.getMsg(id)
          return message.MMPreviewSrc || getMsgImg(message.MsgId, 'big', message) || message.MMThumbSrc
        },

        getMsgVideo: function getMsgVideo(id) {
          var contentChatScope = window.BOT.glue.contentChatScope
          if (!contentChatScope) {
            throw new Error('getMsgVideo() contentChatScope not found')
          }
          var path = contentChatScope.getMsgVideo(id)
          return window.location.origin + path
        },

        /**
         * from playVoice()
         */
        getMsgVoice: function getMsgVoice(id) {
          var confFactory = window.BOT.glue.confFactory
          var accountFactory = window.BOT.glue.accountFactory

          var path = confFactory.API_webwxgetvoice + "?msgid=" + id + "&skey=" + accountFactory.getSkey()
          return window.location.origin + path
        },

        getMsgPublicLinkImg: function getMsgPublicLinkImg(id) {
          var path = '/cgi-bin/mmwebwx-bin/webwxgetpubliclinkimg?url=xxx&msgid=' + id + '&pictype=location'
          return window.location.origin + path
        },

        getBaseRequest: function getBaseRequest() {
          var accountFactory = window.BOT.glue.accountFactory
          var BaseRequest = accountFactory.getBaseRequest()
          console.log(JSON.stringify(BaseRequest))
          return JSON.stringify(BaseRequest)
        },

        getPassticket: function getPassticket() {
          var accountFactory = window.BOT.glue.accountFactory
          return accountFactory.getPassticket()
        },

        getCheckUploadUrl: function getCheckUploadUrl() {
          var confFactory = window.BOT.glue.confFactory
          return confFactory.API_checkupload
        },

        getUploadMediaUrl: function getUploadMediaUrl() {
          var confFactory = window.BOT.glue.confFactory
          return confFactory.API_webwxuploadmedia
        },

        sendMedia: function sendMedia(data) {
          var chatFactory = window.BOT.glue.chatFactory
          var confFactory = window.BOT.glue.confFactory

          if (!chatFactory || !confFactory) {
            window.BOT.log('sendMedia() chatFactory or confFactory not exist.')
            return false
          }

          try {
            var d = {
              ToUserName: data.ToUserName,
              MediaId: data.MediaId,
              MsgType: data.MsgType,
              FileName: data.FileName,
              FileSize: data.FileSize,
              MMFileExt: data.MMFileExt,
            }

            if (data.Signature) {
              d.Signature = data.Signature
            }

            var m = chatFactory.createMessage(d)

            m.MMFileStatus = confFactory.MM_SEND_FILE_STATUS_SUCCESS
            m.MMStatus = confFactory.MSG_SEND_STATUS_SUCC
            m.sendByLocal = false

            chatFactory.appendMessage(m)
            chatFactory.sendMessage(m)
          } catch (e) {
            window.BOT.log('sendMedia() exception: ' + e.message)
            return false
          }
          return true
        },

        forward: function forward(baseData, patchData) {
          var chatFactory = window.BOT.glue.chatFactory
          var confFactory = window.BOT.glue.confFactory

          if (!chatFactory || !confFactory) {
            window.BOT.log('forward() chatFactory or confFactory not exist.')
            return false
          }

          try {
            var m = chatFactory.createMessage(baseData)

            // Need to override the parametes after called createMessage()
            m = Object.assign(m, patchData)

            chatFactory.appendMessage(m)
            chatFactory.sendMessage(m)
          } catch (e) {
            window.BOT.log('forward() exception: ' + e.message)
            return false
          }
          return true
        },


        send: function send(ToUserName, Content) {
          var chatFactory = window.BOT.glue.chatFactory
          var confFactory = window.BOT.glue.confFactory

          if (!chatFactory || !confFactory) {
            window.BOT.log('send() chatFactory or confFactory not exist.')
            return false
          }
          try {
            console.log('say ToUserName:' + ToUserName)
            console.log('Content:' + Content)
            var m = chatFactory.createMessage({
              ToUserName: ToUserName,
              Content: Content,
              MsgType: confFactory.MSGTYPE_TEXT,
            })
            chatFactory.appendMessage(m)
            chatFactory.sendMessage(m)
          } catch (e) {
            window.BOT.log('send() exception: ' + e.message)
            return false
          }
          return true
        },
        getContact: function getContact(id) {
          var contactFactory = window.BOT.glue.contactFactory
          if (!contactFactory) {
            window.BOT.log('contactFactory not inited')
            return null
          }
          var c = contactFactory.getContact(id)
          var contactWithoutFunction = {}

          if (c) {
            if (c.isContact) {
              c.stranger = !(c.isContact())
            }

            Object.keys(c).forEach(function (k) {
              if (typeof c[k] !== 'function') {
                contactWithoutFunction[k] = c[k]
              }
            })

          } else {


            c = Object.keys(_contacts)
              .filter(id => id.match(/^@@/))    // only search in room
              .map(id => _contacts[id])         // map to room array
              .filter(r => r.MemberList.length) // get rid of room without member list
              .filter(r => r.MemberList
                .filter(m => m.UserName === id)
                .length
              )
              .map(c => c.MemberList
                .filter(m => m.UserName === id)
              [0]
              )
            [0]

            if (c) {
              c.stranger = true

              Object.keys(c).forEach(k => {
                if (typeof c[k] !== 'function') {
                  contactWithoutFunction[k] = c[k]
                }
              })
            }

          }

          return contactWithoutFunction
        },

        getUserName: function getUserName() {
          if (!window.BOT.loginState()) {
            return null
          }
          var accountFactory = window.BOT.glue.accountFactory
          return accountFactory
            ? accountFactory.getUserName()
            : null
        },

        contactFind: function contactFind(filterFunction) {
          var contactFactory = window.BOT.glue.contactFactory

          var match
          if (!filterFunction) {
            match = () => true
          } else {
            match = eval(filterFunction)
          }

          return new Promise(resolve => retryFind(0, resolve))

          // return

          // retry 3 times, sleep 300ms between each time
          function retryFind(attempt, callback) {
            attempt = attempt || 0

            var contactList = contactFactory
              .getAllFriendContact()
              .filter(c => match(c))
              .map(c => c.UserName)

            if (contactList && contactList.length) {
              callback(contactList)
            } else if (attempt > 3) {
              callback([])
            } else {
              attempt++
              setTimeout(() => retryFind(attempt, callback), 1000)
            }

          }
        },

        contactRemark: function contactRemark(UserName, remark) {
          if (remark === null || remark === undefined) {
            remark = ''
          }

          var contact = _contacts[UserName]
          if (!contact) {
            throw new Error('contactRemark() can not found UserName ' + UserName)
          }

          var accountFactory = window.BOT.glue.accountFactory
          var confFactory = window.BOT.glue.confFactory
          var emojiFactory = window.BOT.glue.emojiFactory
          var mmHttp = window.BOT.glue.mmHttp

          return new Promise(resolve => {
            mmHttp({
              method: "POST",
              url: confFactory.API_webwxoplog,
              data: angular.extend({
                UserName: UserName,
                CmdId: confFactory.oplogCmdId.MODREMARKNAME,
                RemarkName: emojiFactory.formatHTMLToSend(remark),
              }, accountFactory.getBaseRequest()),
              MMRetry: {
                count: 3,
                timeout: 1e4,
                serial: !0,
              }
            })
              .success(() => {
                contact.RemarkName = remark
                return resolve(true)
              })
              .error(() => {
                return resolve(false)  // TODO: use reject???
              })
          })
        },

        roomFind: function roomFind(filterFunction) {
          var contactFactory = window.BOT.glue.contactFactory

          var match
          if (!filterFunction) {
            match = () => true
          } else {
            match = eval(filterFunction)
          }
          //window.BOT.log(match.toString())
          return contactFactory.getAllChatroomContact()
            .filter(r => match(r.NickName))
            .map(r => r.UserName)
        },

        roomDelMember: function roomDelMember(ChatRoomName, UserName) {
          var chatroomFactory = window.BOT.glue.chatroomFactory
          return chatroomFactory.delMember(ChatRoomName, UserName)
        },

        roomAddMember: function roomAddMember(ChatRoomName, UserName) {
          var chatroomFactory = window.BOT.glue.chatroomFactory
          //window.BOT.log(ChatRoomName)
          //window.BOT.log(UserName)

          return new Promise(resolve => {
            // There's no return value of addMember :(
            // https://github.com/wechaty/webwx-app-tracker/blob/f22cb043ff4201ee841990dbeb59e22643092f92/formatted/webwxApp.js#L2404-L2413
            var timer = setTimeout(() => {
              window.BOT.log('roomAddMember() timeout')
              // TODO change to reject here. (BREAKING CHANGES)
              return resolve(0)
            }, 10 * 1000)

            chatroomFactory.addMember(ChatRoomName, UserName, function (result) {
              clearTimeout(timer)
              return resolve(1)
            })
          })
        },

        roomModTopic: function roomModTopic(ChatRoomName, topic) {
          var chatroomFactory = window.BOT.glue.chatroomFactory
          return chatroomFactory.modTopic(ChatRoomName, topic)
        },

        roomCreate: function roomCreate(UserNameList, topic) {
          var UserNameListArg = UserNameList.map(function (n) { return { UserName: n } })

          var chatroomFactory = window.BOT.glue.chatroomFactory
          var state = window.BOT.glue.state

          return new Promise(resolve => {
            chatroomFactory.create(UserNameListArg)
              .then(function (r) {
                if (r.BaseResponse && 0 == r.BaseResponse.Ret || -2013 == r.BaseResponse.Ret) {
                  state.go('chat', { userName: r.ChatRoomName }) // BE CAREFUL: key name is userName, not UserName! 20161001
                  // if (topic) {
                  //   setTimeout(_ => roomModTopic(r.ChatRoomName, topic), 3000)
                  // }
                  if (!r.ChatRoomName) {
                    throw new Error('chatroomFactory.create() got empty r.ChatRoomName')
                  }
                  resolve(r.ChatRoomName)
                } else {
                  throw new Error('chatroomFactory.create() error with Ret: '
                    + r && r.BaseResponse.Ret
                    + 'with ErrMsg: '
                    + r && r.BaseResponse.ErrMsg
                  )
                }
              })
              .catch(function (e) {
                // TODO change to reject (BREAKIKNG CHANGES)
                resolve(
                  JSON.parse(
                    JSON.stringify(
                      e
                      , Object.getOwnPropertyNames(e)
                    )
                  )
                )
              })
          })
        },

        verifyUserRequest: function verifyUserRequest(UserName, VerifyContent) {
          VerifyContent = VerifyContent || '';

          var contactFactory = window.BOT.glue.contactFactory
          var confFactory = window.BOT.glue.confFactory

          var Ticket = '' // what's this?

          return new Promise(resolve => {
            contactFactory.verifyUser({
              Opcode: confFactory.VERIFYUSER_OPCODE_SENDREQUEST,
              Scene: confFactory.ADDSCENE_PF_WEB,
              UserName,
              Ticket,
              VerifyContent,
            })
              .then(() => {  // succ
                // alert('ok')
                //window.BOT.log('friendAdd(' + UserName + ', ' + VerifyContent + ') done')
                resolve(true)
              }, (err) => {    // fail
                // alert('not ok')
                window.BOT.log('friendAdd(' + UserName + ', ' + VerifyContent + ') fail: ' + err)
                resolve(false)
              })
          })
        },

        verifyUserOk: function verifyUserOk(UserName, Ticket) {
          var contactFactory = window.BOT.glue.contactFactory
          var confFactory = window.BOT.glue.confFactory

          return new Promise(resolve => {
            contactFactory.verifyUser({
              UserName: UserName,
              Opcode: confFactory.VERIFYUSER_OPCODE_VERIFYOK,
              Scene: confFactory.ADDSCENE_PF_WEB,
              Ticket: Ticket,
            }).then(() => {  // succ
              // alert('ok')
              window.BOT.log('friendVerify(' + UserName + ', ' + Ticket + ') done')
              return resolve(true)
            }, err => {       // fail
              // alert('err')
              window.BOT.log('friendVerify(' + UserName + ', ' + Ticket + ') fail')
              return resolve(false)
            })
          })
        },

      }
      if (!window.BOT.angularIsReady()) {
        retObj.code = 503 // 503 SERVICE UNAVAILABLE https://httpstatuses.com/503
        retObj.message = 'init() without a ready angular env'
        return retObj
      }
      console.log('load end angular')
      if (window.BOT.vars.initState === true) {
        window.BOT.log('BOT.init() called twice: already inited')
        retObj.code = 304 // 304 Not Modified https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.3.5
        retObj.message = 'init() already inited before. returned with do nothing'
        return retObj
      }

      if (window.BOT.MMCgiLogined()) {
        window.BOT.login('page refresh')
      }

      window.BOT.glueToAngular()
      window.BOT.hookEvents()
      window.BOT.hookRecalledMsgProcess()

      window.BOT.log('init() scanCode: ' + window.BOT.vars.scanCode)
      setTimeout(() => window.BOT.checkScan(), 1000)

      window.BOT.heartBeat(true)

      window.BOT.log('inited!. ;-D')
      window.BOT.vars.initState = true

      retObj.code = 200
      retObj.message = 'BOT Init Succ'
      console.log(retObj.message)
      return retObj
    }());

  })
  Object.defineProperty(angular, 'bootstrap', {
    get: () => angularBootstrapReal ? function (element, moduleNames) {
      let checkEmojiContent = (value, constants) => {
        if (!(value.AddMsgList instanceof Array)) return value;
        value.AddMsgList.forEach((msg) => {
          switch (msg.MsgType) {
            // case constants.MSGTYPE_TEXT:
            //   msg.Content = EmojiParser.emojiToImage(msg.Content);
            //   break;
            case constants.MSGTYPE_EMOTICON:
              Injector.lock(msg, 'MMDigest', '[Emoticon]');
              Injector.lock(msg, 'MsgType', constants.MSGTYPE_EMOTICON);
              if (msg.ImgHeight >= Common.EMOJI_MAXIUM_SIZE) {
                Injector.lock(msg, 'MMImgStyle', { height: `${Common.EMOJI_MAXIUM_SIZE}px`, width: 'initial' });
              } else if (msg.ImgWidth >= Common.EMOJI_MAXIUM_SIZE) {
                Injector.lock(msg, 'MMImgStyle', { width: `${Common.EMOJI_MAXIUM_SIZE}px`, height: 'initial' });
              }
              break;
            case constants.MSGTYPE_RECALLED:
              // if (AppConfig.readSettings('prevent-recall') === 'on') {
              if (true) {
                Injector.lock(msg, 'MsgType', constants.MSGTYPE_SYS);
                Injector.lock(msg, 'MMActualContent', Common.MESSAGE_PREVENT_RECALL);
                Injector.lock(msg, 'MMDigest', Common.MESSAGE_PREVENT_RECALL);
              }
              break;
          }
        });
        return value;
      }

      let checkTemplateContent = (value) => {
        const optionMenuReg = /optionMenu\(\);/;
        const messageBoxKeydownReg = /editAreaKeydown\(\$event\)/;
        if (optionMenuReg.test(value)) {
          value = value.replace(optionMenuReg, 'optionMenu();shareMenu();');
        } else if (messageBoxKeydownReg.test(value)) {
          value = value.replace(messageBoxKeydownReg, 'editAreaKeydown($event);mentionMenu($event);');
        }
        return value;
      }
      let transformResponse = function transformResponse(value, constants) {
        if (!value) return value;

        switch (typeof value) {
          case 'object':
            /* Inject emoji stickers and prevent recalling. */
            return checkEmojiContent(value, constants);
          case 'string':
            /* Inject share sites to menu. */
            return checkTemplateContent(value);
        }
        return value;
      }
      const moduleName = 'webwxApp';
      if (moduleNames.indexOf(moduleName) < 0) return;
      let constants = null;
      angular.injector(['ng', 'Services']).invoke(['confFactory', (confFactory) => (constants = confFactory)]);
      angular.module(moduleName).config(['$httpProvider', ($httpProvider) => {
        $httpProvider.defaults.transformResponse.push((value) => {
          return transformResponse(value, constants);
        });
      },
      ]).run(['$rootScope', ($rootScope) => {
        console.log('wx-user-logged')
        //if (MMCgi.isLogin)
        // setTimeout(() => {

        $rootScope.$on('newLoginPage', () => {

        });
        // $rootScope.shareMenu = ShareMenu.inject;
        // $rootScope.mentionMenu = MentionMenu.inject;
      }]);
      return angularBootstrapReal.apply(angular, arguments);
    } : angularBootstrapReal,
    set: (real) => (angularBootstrapReal = real),
  });

  dualspace.injectCSS(path.join(__dirname, 'service.css'));

  dualspace.loop(() => {
    console.log('wechat:getMessage')
    let directCount = 0;
    let indirectCount = 0;
    let chat_item = document.querySelectorAll('div.chat_item');

    Array.prototype.forEach.call(chat_item, function (item) {
      let count = 0;
      let reddot = item.querySelector("i.web_wechat_reddot_middle");
      let avatarImage = item.querySelector("img.img");

      if (reddot && reddot.innerText) {
        count = parseInt(reddot.innerText);
      }
      if (avatarImage && avatarImage.getAttribute("src").search("webwxgeticon") != -1) {
        directCount += count;
      } else {
        indirectCount += count;
      }
    });

    dualspace.setBadge(directCount, indirectCount);
  });


};
