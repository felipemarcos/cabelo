import skrollr, { Easing } from '../src/index';

const run = () => {
  const tl = skrollr()

  tl.add({
      targets: '.title',
      duration: [0, 1000, 1500],
      // scale: [0, 1],
      x: ['-100%', '0%', '100%'],
      // y: [0, 250, 500],
      // scale: {
      //   duration: [150, 200],
      //   value: [0, 1]
      // },
      // rotate: [100, 50, 0],
      opacity: [0, 0.5, 1],
      // backgroundColor: ['#fff', '#252525', '#000'],
      easing: Easing.linear,
      immediateRender: true, // Type: Boolean - Default: true - If you want to render the first value immediately when the tween is created, set immediateRender to true.
      // begin() {},
      // complete() {}
    })
    .on('update', ({scrollY, direction}) => {
      console.log(scrollY, direction);
    })
    .on('begin', () => {
      console.log('begin');
    })
    .on('complete', () => {
      console.log('complete');
    })
    .init();
};

window.addEventListener('DOMContentLoaded', run);
