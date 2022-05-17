import translate from "@vitalets/google-translate-api";
import gm from "gm";
import { IgApiClient } from "instagram-private-api";
import prompt from "prompt";
import random from "lodash.random";
import fetch from "node-fetch";
import { EUploadMimeType, TwitterApi } from "twitter-api-v2";

async function translateEn(text) {
  const res = await translate(text, { to: "en" });
  return res.text;
}

async function getRandomStyle(womboInstance) {
  const styles = await womboInstance.fetchStyles();
  return styles[random(0, styles.length - 1)];
}

async function prepareImage(imageUrl) {
  const res = await fetch(imageUrl);
  return new Promise((resolve, reject) => {
    gm(res.body)
      .resize(1080, 1350, "^")
      .gravity("Center")
      .crop(1080, 1350)
      .toBuffer("JPG", function (err, buffer) {
        if (err) {
          reject(err);
          return;
        }
        resolve(buffer);
      });
  });
}

async function publishToTwitter(imageBuffer, caption) {
  const client = new TwitterApi({
    appKey: process.env.TW_API_KEY,
    appSecret: process.env.TW_API_SECRET,
    accessToken: process.env.TW_ACCESS_TOKEN,
    accessSecret: process.env.TW_ACCESS_SECRET,
  });

  const mediaId = await client.v1.uploadMedia(imageBuffer, {
    mimeType: EUploadMimeType.Jpeg,
  });

  return client.v1.tweet(caption, { media_ids: mediaId });
}

async function verifyCredentials() {
  if (!(await verifyInstagramCredentials())) {
    return false;
  }

  if (!(await verifyTwitterCredentials())) {
    return false;
  }

  return true;
}

async function verifyInstagramCredentials() {
  const { IG_USERNAME: username, IG_PASSWORD: password } = process.env;
  if (!username || !password) {
    console.error(
      `Your Instagram username and password from your profile are not defined in the config file.
      Add that info in the IG_USERNAME and IG_PASSWORD properties into your .env file and start over.`
    );
    return false;
  }
  return true;
}

async function verifyTwitterCredentials() {
  const { TW_API_KEY: apiKey, TW_API_SECRET: apiSecret } = process.env;

  if (!apiKey || !apiSecret) {
    console.error(
      `Your Twitter API Key and Secret are not defined in the config file.
      - Go to https://developer.twitter.com/en/portal/projects-and-apps
      - Select your project and then go to "Keys and tokens" section
      - Generate your Consumer keys.
      - Add that info in the TW_API_KEY and TW_API_SECRET properties into your .env file and start over.`
    );
    return false;
  }

  const { TW_ACCESS_TOKEN, TW_ACCESS_SECRET } = process.env;

  if (!TW_ACCESS_TOKEN || !TW_ACCESS_SECRET) {
    console.warn(
      "No access token detected for publishing at Twitter. Starting authorization process..."
    );

    const { accessToken, accessSecret, pin } = await authorizeTwitterUser();
    const client = new TwitterApi({
      appKey: process.env.TW_API_KEY,
      appSecret: process.env.TW_API_SECRET,
      accessToken,
      accessSecret,
    });
    const response = await client.login(pin);
    console.info(`Add the following properties into your .env file and then start over:
    - TW_ACCESS_TOKEN: ${response.accessToken}
    - TW_ACCESS_SECRET: ${response.accessSecret}`);

    return false;
  }
  return true;
}

async function authorizeTwitterUser() {
  prompt.start();
  const client = new TwitterApi({
    appKey: process.env.TW_API_KEY,
    appSecret: process.env.TW_API_SECRET,
  });
  const authUrl = await client.generateAuthLink();
  return new Promise((resolve, reject) => {
    const schema = {
      properties: {
        logged: {
          description:
            "Log in to https://twitter.com as the user you want to tweet as and hit enter",
          required: false,
        },
        visit: {
          description: `Visit ${authUrl.url} in your browser and hit enter`,
          required: false,
        },
        pin: {
          description: "What is your PIN?",
          pattern: /^[0-9]+$/,
          message: "PIN has to be numbers only",
          required: true,
        },
      },
    };

    prompt.get(schema, function (err, result) {
      if (err) {
        reject(err);
        return;
      }
      resolve({
        accessToken: authUrl.oauth_token,
        accessSecret: authUrl.oauth_token_secret,
        pin: result.pin,
      });
    });
  });
}

async function publishToInstagram(imageBuffer, caption) {
  const { IG_USERNAME: username, IG_PASSWORD: password } = process.env;
  const igClient = new IgApiClient();
  igClient.state.generateDevice(username);
  // ig.state.proxyUrl = process.env.IG_PROXY;
  await igClient.account.login(username, password);
  return igClient.publish.photo({
    file: imageBuffer,
    caption: caption,
  });
}

export {
  translateEn,
  getRandomStyle,
  prepareImage,
  publishToInstagram,
  publishToTwitter,
  verifyCredentials,
};
