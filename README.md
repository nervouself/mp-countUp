# mp-countUp
小程序适用的数字 count up 库

Inspired by [countUp.js](https://github.com/inorganik/countUp.js).

## usage

```js
import CountUp from '../lib/countUp.js';

Page({
  data: {
    num: 0,
  },

  go() {
    if (!this.numAnim) {
      this.numAnim = new CountUp(0, 1000, 1, this.upNum);
      this.numAnim.start(() => {
        console.log('done');
      });
    } else {
      this.numAnim.update(+this.data.num + 1000);
    }
  },

  upNum(num) {
    this.setData({ num });
  },
});
```
