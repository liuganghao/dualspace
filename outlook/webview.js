"use strict";

module.exports = dualspace => {
  const getMessages = function getMessages() {
    const unreadMail = parseInt(jQuery("i[data-icon-name='Inbox'] + span + span > span").first().text(), 10);
    dualspace.setBadge(unreadMail);
  };
  dualspace.loop(getMessages);
};
