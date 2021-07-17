/* eslint-disable @typescript-eslint/no-var-requires */

const os = require('os');
const https = require('https');
const childProcess = require('child_process');

const path = require('path');

const QRCode = require('qrcode');

const express = require('express');
const bodyParser = require('body-parser');

const {
  writeFile,
  readFile,
  stat,
} = require('fs/promises');

const port = process.env.PORT || 7583;

const serverKeyPath = path.join(
  __dirname, 'server-key.pem',
);

const serverCertPath = path.join(
  __dirname, 'server-cert.perm',
);

const readFileToString = async (path) => {
  const buffer = await readFile(path);
  return buffer.toString();
};

const exec = (command) => new Promise((resolve, reject) => {
  childProcess.exec(command, (error, stdout, stderr) => {
    if (error) {
      reject(error);
      return;
    }
    resolve({ stdout, stderr });
  });
});

const ips = [];
for (const nets of Object.values(os.networkInterfaces())) {
  for (const net of nets) {
    if (net.family === 'IPv4' && !net.internal) {
      ips.push(net.address);
    }
  }
}

const secretPath = path.join(
  __dirname,
  'secret.txt',
);

const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
  if (req.hostname === 'localhost') {
    return res.redirect(`${
      req.protocol
    }://${
      ips[0]
    }:${
      port
    }${
      req.path
    }`);
  }

  return next();
});

const main = async () => {
  try {
    await stat(secretPath);
    return;
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

    const key = await readFileToString(serverKeyPath);
    const cert = await readFileToString(serverCertPath);

    https.createServer({
      key,
      cert,
    }, app).listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Locker / Unlocker listening on port ${port}`);
    });
  }
};

app.get('/', async (req, res) => {
  const secret = await readFile(secretPath);
  const QRData = JSON.stringify({
    secret: secret.toString('utf-8'),
    serverURL: `${req.protocol}://${req.hostname}:${port}`,
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
  if (secret === req.body.secret) {
    try {
      const out = await exec([
        'dbus-send --session --dest=org.gnome.ScreenSaver',
        '--type=method_call --print-reply --reply-timeout=20000',
        '/org/gnome/ScreenSaver org.gnome.ScreenSaver.SetActive boolean:false',
      ].join(' '));
      res.send(out);
    } catch (e) {
      res.status(500).send(e.message);
    }
  } else {
    res.status(403).send('bad secret');
  }
});

app.post('/lock', async (req, res) => {
  const secret = await readFile(secretPath);
  if (secret === req.body.secret) {
    try {
      const out = await exec([
        'dbus-send --session --dest=org.gnome.ScreenSaver',
        '--type=method_call --print-reply --reply-timeout=20000',
        '/org/gnome/ScreenSaver org.gnome.ScreenSaver.Lock',
      ].join(' '));
      res.send(out);
    } catch (e) {
      res.status(500).send(e.message);
    }
  } else {
    res.status(403).send('bad secret');
  }
});

main();
