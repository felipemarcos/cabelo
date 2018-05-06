import skrollr, { Easing } from '../src/index';

const run = () => {
  const tl = skrollr();
  const scrollPositionEl = document.querySelector('.scroll-position');

  tl
    .add({
      targets: '.title',
      duration: [0, 1000],
      y: [-1000, 0],
      rotate: [100, 0, 0],
      scale: {
        duration: [100, 2000],
        value: [0, 1]
      },
      color: {
        duration: [2000, 2500],
        value: ['#252525', 'rgb(156, 39, 176)']
      },
    })
    .add({
      targets: '.title',
      duration: [1500, 3000],
      rotate: [0, 360],
      opacity: {
        duration: [2900, 3000],
        value: [1, 0]
      }
    })
    .add({
      targets: '.box',
      duration: (el, i) => [2500 + 50 * i, 3000],
      y: [-100, 0],
      opacity: [0, 1],
      x: {
        duration: (el, i) => [3500 - 30 * i, 5000],
        value: [0, `92vw`]
      }
    })
    .add({
      targets: '.box',
      duration: [3500, 5000],
      rotate: [0, 360],
      scale: {
        duration: [4500, 5000],
        value: [1, 0]
      },
      backgroundColor: {
        duration: (el, i) => [3300 + 100 * i, 4300],
        value: ['#3F51B5', '#E91E63']
      },
    })

    .on('update', ({ scrollPosition, direction }) => {
      scrollPositionEl.textContent = scrollPosition;
    })

    // .hook({
    //   duration: 2000,
    //   enter() {
    //     console.log('enter');
    //   },
    //   leave() {
    //     console.log('leave');
    //   }
    // })
    // .on('begin', () => {
    //   console.log('begin');
    // })
    // .on('complete', () => {
    //   console.log('complete');
    // })
    .init();
};

window.addEventListener('DOMContentLoaded', run);
