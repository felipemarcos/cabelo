# base

Description here

## Install

```
$ npm install cabelo
```


## Usage

```js
const cabelo = require('cabelo');

const tl = cabelo();

tl
  .add({
    targets: '.box',
    duration: [0, 1000],
    y: [-1000, 0]
  })
  .init();
```


## API

## License

MIT © [Felipe Marcos](http://felipemarcos.com)
