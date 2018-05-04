import skrollr, { Easing } from '../src/index';

const run = () => {
  const tl = skrollr();
  const scrollPositionEl = document.querySelector('.scroll-position');

  tl
    .add({
      targets: '.title',
      duration: [0, 1000],
      y: [-1000, 0],
      rotate: [100, 0],
      scale: {
        duration: [100, 2000],
        value: [0, 1]
      },
      backgroundColor: ['#fff', '#252525'],
    })
    .add({
      targets: '.title',
      duration: [1500, 3000],
      rotate: [0, 360]
    })
    .hook({
      duration: 2000,
      enter() {
        console.log('enter');
      },
      leave() {
        console.log('leave');
      }
    })
    .on('update', ({ scrollPosition, direction }) => {
      scrollPositionEl.textContent = scrollPosition;
    })
    // .on('begin', () => {
    //   console.log('begin');
    // })
    // .on('complete', () => {
    //   console.log('complete');
    // })
    .init();
};

window.addEventListener('DOMContentLoaded', run);
