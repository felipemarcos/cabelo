import is from '../src/utils/is';

const types = [
  {
    is: is.arr,
    name: 'array',
    fixtures: [
      [1, 2],
      new Array(2) // tslint:disable-line:prefer-array-literal
    ]
  },
  {
    is: is.obj,
    name: 'object',
    fixtures: [
      {x: 1},
      Object.create({x: 1})
    ]
  },
  {
    is: is.str,
    name: 'string',
    fixtures: [
      '🦄',
      'hello world',
      ''
    ]
  },
  {
    is: is.fnc,
    name: 'function',
    fixtures: [
      function foo() {},
      function () {},
      () => {},
      async function () {}
    ]
  },
  {
    is: is.und,
    name: 'undefined',
    fixtures: [
      undefined
    ]
  },
  {
    is: is.hex,
    name: 'hex color',
    fixtures: [
      '#ffffff',
      '#000',
      '#000000',
    ]
  },
  {
    is: is.rgb,
    name: 'rgb color',
    fixtures: [
      'rgb(255, 255, 255)'
    ]
  },
  {
    is: is.hsl,
    name: 'hsl color',
    fixtures: [
      'hsl(0, 100%, 100%)'
    ]
  },
  {
    is: is.col,
    name: 'color',
    fixtures: [
      'hsl(0, 100%, 100%)',
      'hsl(0, 0%, 0%)'
    ]
  }
];

types
  .forEach((type) => {
    type.fixtures.forEach((fixture) => {
      test(`is ${type.name}`, () => {
        expect(type.is(fixture)).toBeTruthy();
      });
    });
  });
