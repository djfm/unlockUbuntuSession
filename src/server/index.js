/* eslint-disable @typescript-eslint/no-var-requires */

const {
  writeFile,
  readFile,
  stat,
} = require('fs/promises');

const path = require('path');

const {
  generateKeyPair,
  privateEncrypt,
} = require('crypto');

const QRCode = require('qrcode');

const express = require('express');

const keyOptions = {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
};

const privKeyPath = path.join(
  __dirname,
  'privKey.pem',
);

const pubKeyPath = path.join(
  __dirname,
  'pubKey.pem',
);

const initialize = async () => {
  try {
    await stat('privKey.pem');
    await stat('pubKey.pem');
    return;
  } catch (e) {
    // that's OK, we need
    // to initialize, then...
  }

  const keyPair = await new Promise(
    (resolve, reject) => {
      generateKeyPair(
        'rsa',
        keyOptions,
        (err, pubKey, privKey) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            pubKey,
            privKey,
          });
        },
      );
    },
  );

  await Promise.all([
    writeFile(privKeyPath, keyPair.privKey),
    writeFile(pubKeyPath, keyPair.pubKey),
  ]);
};

const app = express();

const port = process.env.PORT || 7583;

app.listen(port, () => {
  console.log(`Locker / Unlocker listening on port ${port}`);
});

const init = initialize();

app.get('/', async (req, res) => {
  await init;
  const privKey = await readFile(privKeyPath);
  const secret = privateEncrypt(privKey, 'to be changed').toString('base64');
  const imgSrc = await QRCode.toDataURL(secret);
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
