import gm from "gm";
import random from "lodash.random";
import request from "request";
import { IgApiClient } from "instagram-private-api";
import { EUploadMimeType, TwitterApi } from "twitter-api-v2";
import translate from "@vitalets/google-translate-api";

async function translateEn(text) {
  const res = await translate(text, { to: "en" });
  return res.text;
}

async function getRandomStyle(womboInstance) {
  const styles = await womboInstance.fetchStyles();
  return styles[random(0, styles.length - 1)];
}

async function prepareImage(imageUrl) {
  return new Promise((resolve, reject) => {
    gm(request(imageUrl))
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
  // if (process.env.TW_USER_PIN) {
  // console.warn(
  //   "No access token detected for publishin on Twitter. Requesting authorization"
  // );
  // console.info(
  //   "Log in to https://twitter.com as the user you want to tweet as and hit enter."
  // );
  // First step
  // const client = new TwitterApi({
  //   appKey: process.env.TW_API_KEY,
  //   appSecret: process.env.TW_API_KEY_SECRET,
  // });
  //
  // const auth_url = await client.generateAuthLink();
  // console.info("Visit %s in your browser and hit enter.", auth_url.url);

  const client = new TwitterApi({
    appKey: process.env.TW_API_KEY,
    appSecret: process.env.TW_API_KEY_SECRET,
    accessToken: process.env.TW_ACCESS_TOKEN,
    accessSecret: process.env.TW_ACCESS_TOKEN_SECRET,
    // accessToken: auth_url.oauth_token:, // oauth token from previous step (link generation)
    // accessSecret: auth_url.oauth_token_secret, // oauth token secret from previous step (link generation)
  });

  const mediaId = await client.v1.uploadMedia(imageBuffer, {
    mimeType: EUploadMimeType.Jpeg,
  });
  const newTweet = await client.v1.tweet(caption, { media_ids: mediaId });
  // }

  // const client = new TwitterApi({
  //   clientId: process.env.TW_CLIENT_ID,
  //   clientSecret: process.env.TW_CLIENT_SECRET,
  // });
  // OAuth2 (app-only or user context)
  // Create a client with an already known bearer token
  // const consumerClient = new TwitterApi(process.env.TW_BEARER_TOKEN);
  // Obtain app-only client
  // const client = await consumerClient.appLogin();
}

async function publishToInstagram(imageBuffer, caption) {
  const ig = new IgApiClient();
  ig.state.generateDevice(process.env.IG_USERNAME);
  // ig.state.proxyUrl = process.env.IG_PROXY;
  await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
  await ig.publish.photo({
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
};
