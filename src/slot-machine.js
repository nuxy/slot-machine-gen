/**
 *  Slot Machine Generator
 *  Create an extremely biased, web-based slot machine game.
 *
 *  Copyright 2020-2025, Marc S. Brooks (https://mbrooks.info)
 *  Licensed under the MIT license:
 *  http://www.opensource.org/licenses/mit-license.php
 */

'use strict';

/**
 * @param {Element} container
 *   Containing HTML element.
 *
 * @param {Array<Object>} reels
 *   Reel configuration.
 *
 * @param {Function} callback
 *   Returns selected pay-line symbols.
 *
 * @param {Object} options
 *   Configuration overrides (optional).
 */
function SlotMachine(container, reels, callback, options) {
  const self = this;

  const REEL_SEGMENT_TOTAL = 24;

  const defaults = {
    reelHeight: 1200,
    reelWidth:  200,
    reelOffset: 20,
    slotYAxis:  0,
    animSpeed:  1000,
    click2Spin: true,
    sounds: {
      reelsBegin: null,
      reelsEnd: null
    },
    rngFunc: function() {

      // The weakest link.
      return Math.random();
    }
  };

  (function() {
    self.options = Object.assign(defaults, options);

    if (reels.length > 0) {
      initGame();
    } else {
      throw new Error('Failed to initialize (missing reels)');
    }
  })();

  /**
   * Initialize a new game instance.
   */
  function initGame() {
    container.setAttribute('aria-label', 'Slot machine');

    createDisplayElm();
    createSlotElm();
  }

  /**
   * Create display elements.
   */
  function createDisplayElm() {
    const div = document.createElement('div');
    div.classList.add('display');

    for (let i = 0; i < reels.length; i++) {
      const elm = document.createElement('div');
      elm.classList.add('reel');
      elm.setAttribute('role', 'none');
      elm.style.transform = `rotateY(${self.options.slotYAxis}deg)`;

      div.appendChild(elm);
    }

    if (self.options.click2Spin) {
      const title = 'Click to spin';

      // Add event to display to spin reels.
      div.addEventListener('click', spinReels);
      div.setAttribute('aria-label', title);
      div.setAttribute('role', 'button');
      div.setAttribute('title', title);
      div.style.cursor = 'pointer';
    }

    container.appendChild(div);
  }

  /**
   * Create slot elements.
   */
  function createSlotElm() {
    const div = document.createElement('div');
    div.classList.add('slots');
    div.setAttribute('aria-label', 'Reels');

    reels.forEach((reel, index) => {
      const elm = createReelElm(reel, reel.symbols[0].position);
      elm.setAttribute('aria-label', `Reel ${index + 1}`);

      div.appendChild(elm);
    });

    container.appendChild(div);
  }

  /**
   * Create reel elements.
   *
   * @param {Object} config
   *   Config options.
   *
   * @param {Number} startPos
   *   Start position.
   *
   * @return {Element}
   */
  function createReelElm(config, startPos = 0) {
    const div = document.createElement('div');
    div.style.transform = `rotateY(${self.options.slotYAxis}deg)`;
    div.classList.add('reel');

    const elm = createStripElm(config, config.symbols[0].position);

    config['element'] = elm;

    div.appendChild(elm);

    return div;
  }

  /**
   * Create strip elements (faux-panoramic animation).
   *
   * @param {Object} config
   *   Config options.
   *
   * @param {Number} startPos
   *   Start position.
   *
   * @return {Element}
   */
  function createStripElm(config, startPos = 0) {
    const stripHeight = getStripHeight();
    const stripWidth  = getStripWidth();

    const segmentDeg = 360 / REEL_SEGMENT_TOTAL;

    const transZ = Math.trunc(
      Math.tan(90 / Math.PI - segmentDeg) * (stripHeight * 0.5) * 4
    );

    const marginTop = transZ + stripHeight / 2;

    const ul = document.createElement('ul');
    ul.style.height    = stripHeight + 'px';
    ul.style.marginTop = marginTop   + 'px';
    ul.style.width     = stripWidth  + 'px';
    ul.classList.add('strip');

    for (let i = 0; i < REEL_SEGMENT_TOTAL; i++) {
      const li = document.createElement('li');
      li.append(i.toString());

      const imgPosY = getImagePosY(i, startPos);
      const rotateX = (REEL_SEGMENT_TOTAL * segmentDeg) - (i * segmentDeg);

      // Position image per the strip angle/container radius.
      li.style.background = `url(${config.imageSrc}) 0 ${imgPosY}px`;
      li.style.height     = stripHeight + 'px';
      li.style.width      = stripWidth  + 'px';
      li.style.transform  = `rotateX(${rotateX}deg) translateZ(${transZ}px)`;

      ul.appendChild(li);
    }

    return ul;
  }

  /**
   * Select a random symbol by weight.
   *
   * @param {Array<Object>} symbols
   *   List of symbols.
   *
   * @return {Object}
   */
  function selectRandSymbol(symbols) {
    let totalWeight = 0;

    const symbolTotal = symbols.length;

    for (let i = 0; i < symbolTotal; i++) {
      const symbol = symbols[i];
      const weight = symbol.weight;

      totalWeight += weight;
    }

    let randNum = getRandom() * totalWeight;

    for (let j = 0; j < symbolTotal; j++) {
      const symbol = symbols[j];
      const weight = symbol.weight;

      if (randNum < weight) {
        return symbol;
      }

      randNum -= weight;
    }
  }

  /**
   * Spin the reels and try your luck.
   */
  function spinReels() {
    const payLine = [];

    if (callback) {

      // Delay callback until animations have stopped.
      payLine.push = function() {
        Array.prototype.push.apply(this, arguments);

        if (payLine.length === reels.length) {
          window.setTimeout(() => {
            self.isAnimating = false;

            callback(payLine);
          }, self.options.animSpeed);
        }
      };
    }

    playSound(self.options.sounds.reelsBegin);

    reels.forEach(reel => {
      const selected = selectRandSymbol(reel.symbols);
      const startPos = selected.position;

      // Start the rotation animation.
      const elm = reel.element;
      elm.classList.remove('stop');
      elm.classList.toggle('spin');

      // Shift images to select position.
      elm.childNodes.forEach((li, index) => {
        li.style.backgroundPositionY = getImagePosY(index, startPos) + 'px';
      });

      // Randomly stop rotation animation.
      window.setTimeout(() => {
        elm.classList.replace('spin', 'stop');

        playSound(self.options.sounds.reelsEnd);

        payLine.push(selected);
      }, self.options.animSpeed * getRandomInt(1, 4));
    });
  }

  /**
   * Get random number between 0 (inclusive) and 1 (exclusive).
   *
   * @return {number}
   */
  function getRandom() {
    return self.options.rngFunc();
  }

  /**
   * Get random integer between two values.
   *
   * @param {Number} min
   *   Minimum value (default: 0).
   *
   * @param {Number} max
   *   Maximum value (default: 10).
   *
   * @return {Number}
   */
  function getRandomInt(min = 1, max = 10) {
    const minNum = Math.ceil(min);
    const maxNum = Math.floor(max);

    return Math.floor(getRandom() * (Math.floor(maxNum) - minNum)) + minNum;
  }

  /**
   * Calculate the strip background position.
   *
   * @param {Number} index
   *   Strip symbol index.
   *
   * @param {Number} position
   *   Strip target position.
   *
   * @return {Number}
   */
  function getImagePosY(index, position) {
    return -Math.abs(
      (getStripHeight() * index) + (position - self.options.reelOffset)
    );
  }

  /**
   * Calculate the strip height.
   *
   * @return {Number}
   */
  function getStripHeight() {
    return self.options.reelHeight / REEL_SEGMENT_TOTAL;
  }

  /**
   * Calculate the strip width.
   *
   * @return {Number}
   */
  function getStripWidth() {
    return self.options.reelWidth;
  }

  /**
   * Play the audio clip.
   *
   * @param {String} url
   *  Audio file URL.
   */
  function playSound(url) {
    if (url) {
      const audio = new Audio();
      audio.src = url;
      audio.onerror = () => console.warn(`Failed to load audio: ${url}`);
      audio.play();
    }
  }

  /**
   * Dispatch game actions.
   *
   * @param {Function} func
   *   Function to execute.
   */
  function dispatch(func) {
    if (!self.isAnimating) {
      self.isAnimating = true;

      func.call(self);
    }
  }

  /**
   * Protected members.
   */
  self.play = function() {
    dispatch(spinReels);
  };

  return self;
}

/**
 * Set global/exportable instance, where supported.
 */
window.slotMachine = function(container, reels, callback, options) {
  return new SlotMachine(container, reels, callback, options);
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SlotMachine;
}
