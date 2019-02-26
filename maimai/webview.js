"use strict";
module.exports = (dualspace, options) => {
    console.log(JSON.stringify(dualspace))
    console.log(options)
    let { ipcRenderer } = require('electron')
    ipcRenderer.sendToHost("serviceConsumer", { id: "datetime", now: Date.now() })
}
