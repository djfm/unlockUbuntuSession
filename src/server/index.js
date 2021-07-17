/* eslint-disable @typescript-eslint/no-var-requires */

const {
  writeFile,
  readFile,
  stat,
} = require('fs/promises');

const path = require('path');

const QRCode = require('qrcode');

const express = require('express');

const secretPath = path.join(
  __dirname,
  'secret.txt',
);

const initialize = async () => {
  try {
    await stat(secretPath);
    return;
  } catch (e) {
    // that's OK, we need
    // to initialize, then...
  }

  const makeRandom = (n) => {
    if (n <= 0) {
      return '';
    }

    return `${Math.random() * 1000000}${makeRandom(n - 1)}`;
  };

  const bigRandomThing = makeRandom(10);

  await writeFile(secretPath, bigRandomThing);
};

const app = express();

const port = process.env.PORT || 7583;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Locker / Unlocker listening on port ${port}`);
});

const init = initialize();

app.get('/', async (req, res) => {
  await init;
  const secret = await readFile(secretPath);
  const QRData = JSON.stringify({
    secret: secret.toString('utf-8'),
    serverURL: `${req.protocol}://${req.hostname}`,
  });

  const imgSrc = await QRCode.toDataURL(QRData);
  const mainStyles = [
    'display: flex',
    'flex-direction: column',
    'align-items: center',
    'justify-content: center',
  ];
  res.send(`
    <main style="${mainStyles.join('; ')}">
      <h1>Lock / Unlock Ubuntu With Phone</h1>
      <p>Scan this to pair the app:</p>
      <img alt="scan this to pair the app" src="${imgSrc}" />
    </main>
  `);
});
