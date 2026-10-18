import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  title: 'cabelo',
  description: 'Tiny, dependency-free library to animate anything based on the scroll position',
  base: '/cabelo/',
  cleanUrls: true,

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/getting-started', activeMatch: '^/(getting-started|tweens|hooks)' },
      { text: 'API', link: '/api' },
      { text: 'Recipes', link: '/recipes' },
      // Plain HTML pages copied next to the site, so they bypass the router
      { text: 'Examples', link: '/examples/', target: '_self' },
      { text: 'Changelog', link: 'https://github.com/felipemarcos/cabelo/blob/master/CHANGELOG.md' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Tweens', link: '/tweens' },
          { text: 'Hooks', link: '/hooks' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'API reference', link: '/api' },
          { text: 'Recipes', link: '/recipes' }
        ]
      }
    ],

    outline: [2, 3],
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/felipemarcos/cabelo' }],
    editLink: {
      pattern: 'https://github.com/felipemarcos/cabelo/edit/master/docs/:path',
      text: 'Edit this page on GitHub'
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Felipe Marcos'
    }
  },

  // Publishes the examples with the bundle they load (../dist/cabelo.js)
  buildEnd({ outDir }) {
    for (const dir of ['examples', 'dist']) {
      fs.cpSync(path.join(root, dir), path.join(outDir, dir), { recursive: true });
    }
  }
});
