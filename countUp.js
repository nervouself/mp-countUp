// Robert Penner's easeOutExpo
function easeOutExpo(t, b, c, d) {
  return c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
}
function ensureNumber(n) {
  return (typeof n === 'number' && !isNaN(n));
}

function CountUp(startVal, endVal, duration, recieveFn, decimals, options) {
  const self = this;

  function formatNumber(num) {
    let neg = (num < 0), x, x1, x2, x3, i, len;
    num = Math.abs(num).toFixed(self.decimals);
    num += '';
    x = num.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? self.options.decimal + x[1] : '';
    if (self.options.useGrouping) {
      x3 = '';
      for (i = 0, len = x1.length; i < len; ++i) {
        if (i !== 0 && ((i % 3) === 0)) {
          x3 = self.options.separator + x3;
        }
        x3 = x1[len - i - 1] + x3;
      }
      x1 = x3;
    }
    // optional numeral substitution
    if (self.options.numerals.length) {
      x1 = x1.replace(/[0-9]/g, function (w) {
        return self.options.numerals[+w];
      });
      x2 = x2.replace(/[0-9]/g, function (w) {
        return self.options.numerals[+w];
      });
    }
    return (neg ? '-' : '') + self.options.prefix + x1 + x2 + self.options.suffix;
  }
  
  // default options
  self.options = {
    useEasing: true, // toggle easing
    useGrouping: true, // 1,000,000 vs 1000000
    separator: '', // character to use as a separator
    decimal: '.', // character to use as a decimal
    easingFn: easeOutExpo, // optional custom easing function, default is Robert Penner's easeOutExpo
    formattingFn: formatNumber, // optional custom formatting function, default is formatNumber above
    prefix: '', // optional text before the result
    suffix: '', // optional text after the result
    numerals: [], // optionally pass an array of custom numerals for 0-9
  };

  // extend default options with passed options object
  if (options && typeof options === 'object') {
    for (let key in self.options) {
      if (options.hasOwnProperty(key) && options[key] !== null) {
        self.options[key] = options[key];
      }
    }
  }

  if (self.options.separator === '') {
    self.options.useGrouping = false;
  } else {
    // ensure the separator is a string (formatNumber assumes this)
    self.options.separator = '' + self.options.separator;
  }

  // make sure requestAnimationFrame and cancelAnimationFrame are defined
  // polyfill for browsers without native support
  // by Opera engineer Erik Möller
  let lastTime = 0;
  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = function (callback) {
      const currTime = new Date().getTime();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const id = setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }
  if (!global.cancelAnimationFrame) {
    global.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }

  self.initialize = function () { 
    if (self.initialized) return true;
    
    self.error = '';
    self.startVal = Number(startVal);
    self.endVal = Number(endVal);
    // error checks
    if (ensureNumber(self.startVal) && ensureNumber(self.endVal)) {
      self.decimals = Math.max(0, decimals || 0);
      self.dec = Math.pow(10, self.decimals);
      self.duration = Number(duration) * 1000 || 2000;
      self.countDown = (self.startVal > self.endVal);
      self.frameVal = self.startVal;
      self.initialized = true;
      return true;
    } else {
      self.error = '[CountUp] startVal (' + startVal + ') or endVal (' + endVal + ') is not a number';
      return false;
    }
  };

  // Print value to target
  self.printValue = function (value) {
    let result = self.options.formattingFn(value);

    recieveFn && recieveFn(result);
  };

  self.count = function (timestamp) {
    if (!self.startTime) { self.startTime = timestamp; }

    self.timestamp = timestamp;
    let progress = timestamp - self.startTime;
    self.remaining = self.duration - progress;

    // to ease or not to ease
    if (self.options.useEasing) {
      if (self.countDown) {
        self.frameVal = self.startVal - self.options.easingFn(progress, 0, self.startVal - self.endVal, self.duration);
      } else {
        self.frameVal = self.options.easingFn(progress, self.startVal, self.endVal - self.startVal, self.duration);
      }
    } else {
      if (self.countDown) {
        self.frameVal = self.startVal - ((self.startVal - self.endVal) * (progress / self.duration));
      } else {
        self.frameVal = self.startVal + (self.endVal - self.startVal) * (progress / self.duration);
      }
    }

    // don't go past endVal since progress can exceed duration in the last frame
    if (self.countDown) {
      self.frameVal = (self.frameVal < self.endVal) ? self.endVal : self.frameVal;
    } else {
      self.frameVal = (self.frameVal > self.endVal) ? self.endVal : self.frameVal;
    }

    // decimal
    self.frameVal = Math.round(self.frameVal * self.dec) / self.dec;

    // format and print value
    self.printValue(self.frameVal);

    // whether to continue
    if (progress < self.duration) {
      self.rAF = requestAnimationFrame(self.count);
    } else {
      if (self.callback) self.callback();
    }
  };
  // start your animation
  self.start = function (callback) {
    if (!self.initialize()) return;
    self.callback = callback;
    self.rAF = requestAnimationFrame(self.count);
  };
  // toggles pause/resume animation
  self.pauseResume = function () {
    if (!self.paused) {
      self.paused = true;
      cancelAnimationFrame(self.rAF);
    } else {
      self.paused = false;
      delete self.startTime;
      self.duration = self.remaining;
      self.startVal = self.frameVal;
      requestAnimationFrame(self.count);
    }
  };
  // reset to startVal so animation can be run again
  self.reset = function () {
    self.paused = false;
    delete self.startTime;
    self.initialized = false;
    if (self.initialize()) {
      cancelAnimationFrame(self.rAF);
      self.printValue(self.startVal);
    }
  };
  // pass a new endVal and start animation
  self.update = function (newEndVal) {
    if (!self.initialize()) return;
    newEndVal = Number(newEndVal);
    if (!ensureNumber(newEndVal)) {
      self.error = '[CountUp] update() - new endVal is not a number: ' + newEndVal;
      return;
    }
    self.error = '';
    if (newEndVal === self.frameVal) return;
    cancelAnimationFrame(self.rAF);
    self.paused = false;
    delete self.startTime;
    self.startVal = self.frameVal;
    self.endVal = newEndVal;
    self.countDown = (self.startVal > self.endVal);
    self.rAF = requestAnimationFrame(self.count);
  };

  // format startVal on initialization
  if (self.initialize()) self.printValue(self.startVal);
}

module.exports = CountUp;


