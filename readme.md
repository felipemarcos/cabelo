# cabelo (WIP)
> Parallax scrolling animation library

Cabelo allows you to animate any css property based on the scroll position.

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
Soon

## License

MIT © [Felipe Marcos](http://felipemarcos.com)
