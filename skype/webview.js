"use strict";

module.exports = dualspace => {
  const getMessages = function getMessages() {
    let count = 0;
    const container = document.querySelector('[role="tablist"] > [title="Chats"] > div');

    if (container) {
      const children = container.children;

      if (children.length === 3) {
        const elementContainer = children[children.length - 1];

        if (elementContainer) {
          const element = elementContainer.querySelector('[data-text-as-pseudo-element]');
          count = parseInt(element.dataset.textAsPseudoElement, 10);
        }
      }
    }

    dualspace.setBadge(count);
  };

  dualspace.loop(getMessages);
};