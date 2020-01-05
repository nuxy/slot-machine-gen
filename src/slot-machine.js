/**
 *  Slot Machine Generator
 *  Create an extremely biased, web-based slot machine game.
 *
 *  Copyright 2020, Marc S. Brooks (https://mbrooks.info)
 *  Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */

function SlotMachine(container, options) {
  const self = this;

  const defaults = {
    reelCount: 3,
    reelHeight: 1320,
    reelWidth: 200,
    reels: []
  };

  (function() {
    self.options = Object.assign(defaults, options);

    if (self.options.reels) {
      initReels();
    } else {
      throw new Error('Failed to initialize (missing reels)');
    }
  })();

  /**
   * Initialize slot reels.
   */
  function initReels() {
    const reels = document.createElement('div');
    reels.classList.add('reels');

    self.reels = self.options.reels;

    for (let i = 1; i <= self.options.reelCount; i++) {
      const name = `reel${i}`;
      const reel = self.reels[name];

      const elm = createReelElm(reel);
      elm.classList.add(name);

      reels.appendChild(elm);

      reel['selected'] = selectRandItem(reel.items);
      reel['_element'] = elm;
    }

    container.appendChild(reels);
  }

  /**
   * Create reel elements (faux-panoramic animation).
   *
   * @param {Object} config
   *   Config options.
   *
   * @return {Element}
   */
  function createReelElm(config) {
    const reelHeight = self.options.reelHeight;
    const reelWidth  = self.options.reelWidth;

    const stripTotal  = 24;
    const stripHeight = reelHeight / stripTotal;
    const stripWidth  = reelWidth;

    const reelDiam = Math.trunc(
      Math.tan(90 / Math.PI - 15) * (stripHeight * 0.5) * 3.8
    );

    const marginTop = (reelDiam / 2) + (stripHeight / 2) * 4;

    const ul = document.createElement('ul');
    ul.style.height    = stripHeight + 'px';
    ul.style.marginTop = marginTop   + 'px';
    ul.style.width     = stripWidth  + 'px';
    ul.classList.add('reel');

    for (let i = 0; i < stripTotal; i++) {
      const li = document.createElement('li');

      const imgPosY = -Math.abs(stripHeight * i);
      const rotateX = (stripTotal * 15) - (i * 15);

      // Position image per the strip angle/container radius.
      li.style.background = `url(${config.imageUrl}) 0px ${imgPosY}px`;
      li.style.height     = stripHeight + 'px';
      li.style.width      = stripWidth  + 'px';
      li.style.transform  = `rotateX(${rotateX}deg) translateZ(${reelDiam}px)`;

      ul.appendChild(li);
    }

    return ul;
  }

  /**
   * Biased selection of a random item by weight.
   *
   * @param {Array<Object>} items
   *   List of items.
   *
   * @return {Object}
   */
   function selectRandItem(items) {
    let totalWeight = 0;

    for (let i = 0; i < items.length; i++) {
      totalWeight += items[i].weight;
    }

    let randNum = Math.random() * totalWeight;

    for (let j = 0; j < items.length; j++) {
      if (randNum < items[j].weight) {
        return items[j];
      }

      randNum -= items[j].weight;
    }
  }

  /**
   * Protected members.
   */
  this.play = function() {
    Object.keys(self.reels).forEach(key => {
      const elm = self.reels[key]._element;

      elm.classList.add('start');

      window.setTimeout(function() {
        elm.classList.replace('start', 'spin');
      }, 200);
    });
  };
}

/**
 * Set global/exportable instance, where supported.
 */
window.slotMachine = function(container, options) {
  return new SlotMachine(container, options);
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SlotMachine;
}
