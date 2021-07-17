/* eslint-disable @typescript-eslint/no-var-requires */

const os = require('os');
const childProcess = require('child_process');

const path = require('path');

const QRCode = require('qrcode');

// eslint-disable-next-line import/no-unresolved
const express = require('express');
// eslint-disable-next-line import/no-unresolved
const bodyParser = require('body-parser');

const {
  writeFile,
  readFile,
  stat,
} = require('fs/promises');

const port = 7583;
const secretPath = path.join(__dirname, 'secret.txt');

const exec = (command) => new Promise((resolve, reject) => {
  childProcess.exec(command, (error, stdout, stderr) => {
    if (error) {
      reject(error);
      return;
    }
    resolve({ stdout, stderr });
  });
});

const app = express();
app.use(bodyParser.json());

app.get('/', async (req, res) => {
  const secret = await readFile(secretPath);
  const QRData = JSON.stringify({
    secret: secret.toString('utf-8'),
    serverURL: `https://${req.headers['x-forwarded-host']}`,
    hostname: os.hostname(),
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

app.post('/unlock', async (req, res) => {
  const secret = await readFile(secretPath);
  if (secret.toString() === req.body.secret) {
    try {
      const out = await exec([
        'dbus-send --session --dest=org.gnome.ScreenSaver',
        '--type=method_call --print-reply --reply-timeout=20000',
        '/org/gnome/ScreenSaver org.gnome.ScreenSaver.SetActive boolean:false',
      ].join(' '));
      res.json({ ok: out.stderr === '' });
    } catch (e) {
      res.status(500).send(e.message);
    }
  } else {
    res.status(403).send('bad secret');
  }
});

app.post('/lock', async (req, res) => {
  const secret = await readFile(secretPath);
  if (secret.toString() === req.body.secret) {
    try {
      const out = await exec([
        'dbus-send --session --dest=org.gnome.ScreenSaver',
        '--type=method_call --print-reply --reply-timeout=20000',
        '/org/gnome/ScreenSaver org.gnome.ScreenSaver.Lock',
      ].join(' '));
      res.json({ ok: out.stderr === '' });
    } catch (e) {
      res.status(500).send(e.message);
    }
  } else {
    res.status(403).send('bad secret');
  }
});

const main = async () => {
  try {
    await stat(secretPath);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }

    const makeRandom = (n) => {
      if (n <= 0) {
        return '';
      }

      return `${Math.random() * 1000000}${makeRandom(n - 1)}`;
    };

    const bigRandomThing = makeRandom(10);

    await writeFile(secretPath, bigRandomThing);
  }

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Locker / Unlocker listening on port ${port}`);
  });
};

main();
