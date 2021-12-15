# headers-for-firebase
> Transform the headers defined in `_headers` to the format needed in your `firebase.json`.

## Introduction
Both [Netlify sites] and [Cloudflare Pages] support `_headers` files as a way to define custom headers when serving websites.

If you deploy your website with [Firebase Hosting], you may have discovered that it completely ignores `_headers` files; headers must be defined in a `firebase.json` file instead, with has a slightly different syntax.

This package grabs your `_headers` file, parse the rules and convert them into Firebase's format, and insert them within `firebase.json`'s `hosting.headers` property for you.

## Install
``` bash
npm install headers-for-firebase
```

## Usage
1. Edit your `firebase.json` to include two comments, where the headers will be included:
    ``` diff
    {
        "hosting": {
            "headers": [
    +            /* _headers */
    +            /* end _headers */
            ]
        }
    }
    ```
1. Call `headers-for-firebase` before publishing, either in the CLI or programmatically.

### Option 1: Using the CLI
Assuming you have a `build` script within your `package.json` that generates your `_headers` file, write a new `postbuild` script that calls `headers-for-firebase`:

``` diff
{
    "package": "your-package-name",
    "scripts": {
+        "postbuild": "headers-for-firebase"
    }
}
```

By default `headers-for-firebase` assumes there are two files: `./_site/_headers` and `./firebase.json`; you can customize the paths by running

``` bash
$ headers-for-firebase --headers "./path/to/headers" --firebase "./path/to/firebase.json"
```

### Option 2: Calling it programmatically
Assuming you have a `build.js` script that generates your `_headers` file; you can add these two lines:

``` javascript
import { addHeadersToFirebaseConfigFile } from "headers-for-firebase";

// call this function after `_headers` is generated; it will return a Promise
addHeadersToFirebaseConfigFile("./path/to/headers", "./path/to/firebase.json");
```

## API
### addHeadersToFirebaseConfigFile(headersPath, firebasePath)
Transform the headers defined in the content of `headersPath`, and saved them in `firebasePath`.

Returns a `Promise` with the number of targets successfully added; rejects if
- any of the paths are unavailable, or
- the content of `firebasePath` does not include the two required comments.

[Netlify sites]: https://docs.netlify.com/routing/headers/ "Netlify _headers documentation"
[Cloudflare Pages]: https://developers.cloudflare.com/pages/platform/headers "CloudFlare _headers documentation"
[Firebase Hosting]: https://firebase.google.com/docs/hosting/full-config#glob_pattern_matching

## Author
Carlos Molina Avendaño ©, released under [MIT License](./LICENSE).
