"use strict";

module.exports = dualspace => {
  const getMessages = function getMessages() {
    let count = 0;

    if (document.getElementsByClassName('J-Ke n0').length > 0) {
      if (document.getElementsByClassName('J-Ke n0')[0].getAttribute('aria-label') != null) {
        count = parseInt(document.getElementsByClassName('J-Ke n0')[0].getAttribute('aria-label').replace(/[^0-9.]/g, ''), 10);
      }
    }

    count = parseInt(count, 10);

    if (isNaN(count)) {
      count = 0;
    }

    dualspace.setBadge(count);
  };

  dualspace.loop(getMessages);
};