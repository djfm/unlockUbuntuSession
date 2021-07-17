# Unlock Ubuntu With Phone

This is a react-native app to unlock your ubuntu session with your phone.

Yes, I'm lazy like that, my password is long.

It probably works on many gnome-based distros, but let's keep it to Ubuntu
because I haven't tested it anywhere else.

## Setup

You need to have an SSL domain forwarding requests to node.

The easiest way to do that is to:

- start the server with `yarn server`
- copy `doc/unlock.apache.conf` to `/etc/apache2/sites-enabled/`
- adapt it as needed
- don't forget to `a2ensite unlock.apache.conf` and reload apache2
- then check that browsing `unlock.example.com`
  correctly displays the QR code page
- use [certbot](https://certbot.eff.org/) to enable SSL on the new vhost

## Usage

- install the android app
- start the server with `yarn server`
- browse to the URL you specified in configuring your vhost
  on the same machine where you ran `yarn server`
- flash the QR code with the app
- follow the instructions in the app