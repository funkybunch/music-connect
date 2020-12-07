<div align="left">
  <a href="https://github.com/funkybunch/music-connect">
    <img src="https://raw.githubusercontent.com/funkybunch/music-connect/main/src/img/music-connect.svg" width="400" alt="Music Connect Logo"/>
  </a>
  <br>
  <br>
  
[![build][build]][build-url]
[![license][license]][license-url]
[![deps][deps]][deps-url]
[![webpack][webpack]][webpack-url]
[![prs][prs]][prs-url]
[![sponsor][sponsor]][sponsor-url]
  
  
  # Music Connect
  <p>
    Music Connect is a remote music education web app that allows for lossless real-time remote playback.
  </p>
</div>

## Before You Start
### `OAuth 2.0` Consent Screen
This application uses Google for authentication.  First, you will need to configure an OAuth Consent Screen.  Be sure to request access to the following scopes:
| API | Scope | User-facing Description |
| --- | ----- | ----------------------- |
| People API | ./auth/userinfo.email | View your email address |
| People API | ./auth/userinfo.profile | See your personal info, including any personal info you've made publicly available |

The `OAuth 2.0` Consent Screen can be created here: [https://console.developers.google.com/apis/credentials/consent](https://console.developers.google.com/apis/credentials/consent)

Both of these scopes are considered Non-Sensitive and do not require app verification.

### `OAuth 2.0` Client ID
In order to run the application, even locally, you will also need to setup `OAuth 2.0` Client ID at [https://console.developers.google.com/apis/credentials](https://console.developers.google.com/apis/credentials).  Do this after you have already setup your Consent Screen.

## Getting Started
### Dependencies
This software uses the Node JS runtime.
1. If you don't already have it, [install Node JS](https://nodejs.org/en/) before continuing.
2. If you don't already have it, [install Node Package Manager (NPM)](https://www.npmjs.com/get-npm) before continuing.

### Installation
1. Fork or clone the repository.
2. Run `npm install`
3. You will need to move your `OAuth 2.0` Client ID `JSON` file into the project root.  You can download this from [https://console.developers.google.com/apis/credentials](https://console.developers.google.com/apis/credentials) under "OAuth 2.0 Client IDs".
4. Rename your `OAuth 2.0` credentials file (that you just downloaded) to `google-client-credentials.json`.
5. Rename `.env-sample` to `.env`.  Inside change the value of `APPSECRET` to any random string (this is your JWT secret) and the value of `INSTRUCTORS` to include your email address.  If you do not need more than one instructor email address, then remove the other.  If you need more, expand the array as you need.

## Running
1. Run `npm run build`
2. Run `npm start`
3. Open [`http://localhost:3000`](http://localhost:3000)

## Accessing the Instructor View
Instructor view classroom routes start with `/i/***-***-****`.  If an `/i/` is in the URL, you are accessing an instructor view.  Be sure to sign in with a Google account that is linked to the email address you used in the `INSTRUCTORS` environment variable in the `.env` file.  Otherwise access will be denied to instructor views.

## Accessing the Student View
Student view classroom routes start with `/c/***-***-****`.  If an `/c/` is in the URL, you are accessing a student view.  You may sign in with the same account that also has instructor permissions, or sign in with a different account entirely.

**IMPORTANT**
If you are testing instructor and student view all on the same computer, you must use two different browsers (i.e Chrome and Firefox) or use a private browsing/incognito window.  This application uses WebRTC which is not intended to connect to users with the same session across multiple tabs.  You must create separate sessions to create a successful connection between a student and instructor.


## Contributing
See [CONTRIBUTING.md](https://github.com/funkybunch/music-connect/blob/main/CONTRIBUTING.md)

[build]: https://github.com/funkybunch/music-connect/workflows/NPM%20Build%20Test/badge.svg
[build-url]: https://github.com/funkybunch/music-connect/actions?query=workflow%3A%22NPM+Build+Test%22
[deps]: https://img.shields.io/david/funkybunch/music-connect.svg
[deps-url]: https://david-dm.org/funkybunch/music-connect
[prs]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg
[prs-url]: https://github.com/funkybunch/music-connect/blob/main/CONTRIBUTING.md
[license]: https://img.shields.io/github/license/funkybunch/music-connect
[license-url]: https://github.com/funkybunch/music-connect/blob/main/LICENSE
[sponsor]: https://img.shields.io/badge/sponsor-%2410-brightgreen
[sponsor-url]: https://github.com/sponsors/funkybunch
[webpack]: https://img.shields.io/github/package-json/dependency-version/funkybunch/music-connect/webpack
[webpack-url]: https://npmjs.org/package/webpack/
