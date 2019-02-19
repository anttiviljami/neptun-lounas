const _ = require('lodash');
const axios = require('axios');
const cheerio = require('cheerio');

const MENU_URL = process.env.MENU_URL;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;
const SLACK_USERNAME = process.env.SLACK_USERNAME || 'Neptun Lounas';

const quips = [
  'Tämmöstä ois tarjolla:',
  'Tänään tämmöstä:',
  'Mites syömishommat?',
  'Syömistouhuja?',
  'Lounastouhuja?',
  'Syömään?',
  'Lounasmeiningit?',
  'Lounasjuna? :steam_locomotive:',
  'Oisko tänään Nepalipäivä?',
  'Hesburger kanawrap?',
  'Onneks tänään on perjantai!'
];

const emojis = [
  ':green_salad:',
  ':stew:',
  ':curry:',
  ':poultry_leg:',
  ':broccoli:',
  ':shallow_pan_of_food:',
  ':rice:',
  ':pancakes:',
  ':potato:',
  ':fork_and_knife:',
  ':knife_fork_plate:',
  ':taco:',
  ':carrot:'
];

const days = [
  'Sunnuntai',
  'Maanantai',
  'Tiistai',
  'Keskiviikko',
  'Torstai',
  'Perjantai',
  'Lauantai'
];

async function handler() {
  try {
    const day = days[new Date().getDay()];
    console.log(`---> Today is ${day}`);

    console.log(`---> Fetching menu from ${MENU_URL}...`);
    const { data: menuHTML } = await axios.get(MENU_URL);

    console.log('---> Parsing menu...');
    const $ = cheerio.load(menuHTML, { normalizeWhitespace: true });

    const $today = $('table').filter((i, el) => {
      const header = $(el)
        .find('h2')
        .text()
        .trim();
      return header === day;
    });

    if (!$today.length) {
      console.log('No day found. Skipping run!');
      return { skip: true };
    }

    const items = $today
      .find('tr:not(.space) td[align="left"]')
      .map((i, el) => {
        const text = $(el)
          .text()
          .trim()
          .replace(/\s\s/g, ' ')
          .replace(/\s+\(/g, ' (');
        return text.startsWith('BISTRO') || text === day
          ? `\n${text}`
          : `- ${text}`;
      })
      .get();

    if (!items.length) {
      console.log('No items found. Skipping run!');
      return { skip: true };
    }

    const randomEmojis = [
      emojis[_.random(emojis.length - 1)],
      emojis[_.random(emojis.length - 1)],
      emojis[_.random(emojis.length - 1)]
    ];

    const payload = {
      username: SLACK_USERNAME,
      channel: SLACK_CHANNEL,
      text: `${quips[_.random(quips.length - 1)]} ${randomEmojis.join('')}`,
      attachments: [
        {
          fallback: _.first(items),
          title: _.first(items),
          color: '#36a64f',
          text: _.slice(items, 1).join('\n'),
          author_name: 'www.antell.fi',
          author_link: MENU_URL
        }
      ]
    };

    console.log('Sending the payload...');
    console.log(payload);

    const res = await axios.post(SLACK_WEBHOOK_URL, payload);
    return { success: true, res: res.data };
  } catch (err) {
    console.error(err);
    return { error: err };
  }
}

module.exports.handler = handler;
