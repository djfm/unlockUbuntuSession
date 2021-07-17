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
} = require('fs/promises');

const port = 7583;
const secretsPath = path.join(__dirname, 'secrets.json');

const exec = (command) => new Promise((resolve, reject) => {
  childProcess.exec(command, (error, stdout, stderr) => {
    if (error) {
      reject(error);
      return;
    }
    resolve({ stdout, stderr });
  });
});

const loadSecretsDB = async () => {
  try {
    const buffer = await readFile(secretsPath);
    const str = buffer.toString();
    const data = JSON.parse(str);
    return data;
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
    return {};
  }
};

const writeSecrets = async (secrets) =>
  writeFile(secretsPath, JSON.stringify(secrets));

const makeRandomString = () => {
  const makeRandom = (n) => {
    if (n <= 0) {
      return '';
    }

    return `${Math.random() * 1000000}${makeRandom(n - 1)}`;
  };

  return makeRandom(10).replace(/\./g, 'Z');
};

// maybe later I'll implement some sort of
// expiration mechanism
const isValidSecret = (secret) => {
  if (!secret) {
    return false;
  }

  return true;
};

const validateSecret = async (secret) => {
  const secrets = await loadSecretsDB();
  return isValidSecret([secrets[secret]]);
};

const app = express();
app.use(bodyParser.json());

app.get('/', async (req, res) => {
  // Normally you have to have this
  // server running in HTTPS,
  // the easiest way to do so is to
  // proxy-pass with apache and
  // use let's encrypt's certbot provide
  // and maintain a certificate...
  // this assumes you can have a domain
  // name pointing to your machine.

  // I'm assuming that if we're forwarding, that's
  // to get https without node being aware of it
  const protocol = req.headers['x-forwarded-host']
    ? 'https' : 'http';

  // so if we're forwarding, the hostname
  // comes from the request headers, not
  // from the hostname
  const hostname = protocol === 'https'
    ? req.headers['x-forwarded-host']
    : req.hostname;

  // seems weird to define a route inside a route,
  // but it works well, the '/img' handler
  // just gets overridden with every request to '/'
  app.get('/img', async (imgReq, imgRes) => {
    imgRes.set('Access-Control-Allow-Origin', '*');
    const secret = makeRandomString();

    const QRData = JSON.stringify({
      secret,
      serverURL: `${protocol}://${hostname}`,
      hostname: os.hostname(),
    });

    const secrets = await loadSecretsDB();
    secrets[secret] = true;
    await writeSecrets(secrets);

    const imgSrc = await QRCode.toDataURL(QRData);

    imgRes.send(
      `<img alt="scan this to pair the app" src="${imgSrc}" />`,
    );
  });

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
      <div id="img">Just a minute, please...</div>
      <script>
        const message = (msg) => {
          document.getElementById('img').innerHTML = msg;
        }
        fetch('http://localhost:${port}/img').then(
          (resp) => {
            if (resp.ok) {
              resp.text().then(
                (html) => {
                  const tmp = document.createElement('div');
                  tmp.innerHTML = html;
                  document
                    .getElementById('img')
                    .replaceWith(tmp.firstChild);
                },
                (err) => {
                  message('Could not obtain QR code.');
                },
              );
            } else {
              message('Something unexpected happened, sorry.');
            }
          },
        ).catch((err) => {
          message(\`
            <p>
              It appears you are not browsing this page from
              the computer where the unlock server is running.
            </p>
            <p>
              So you won't be able to get an unlock code.
            </p>
          \`);
        });
      </script>
    </main>
  `);
});

app.post('/unlock', async (req, res) => {
  const allowed = await validateSecret(req.body.secret);
  if (allowed) {
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
  const allowed = await validateSecret(req.body.secret);
  if (allowed) {
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

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Locker / Unlocker listening on port ${port}`);
});
