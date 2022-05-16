import gm from "gm";
import random from "lodash.random";
import request from "request";
import { IgApiClient } from "instagram-private-api";
import translate from "@vitalets/google-translate-api";

async function translateEn(text) {
  const res = await translate(text, { to: "en" });
  return res.text;
}

async function getRandomStyle(womboInstance) {
  const styles = await womboInstance.fetchStyles();
  return styles[random(0, styles.length - 1)].id;
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

async function publishToInstagram(imageBuffer, caption) {
  const ig = new IgApiClient();
  ig.state.generateDevice(process.env.IG_USERNAME);
  // ig.state.proxyUrl = process.env.IG_PROXY;
  await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
  await ig.publish.photo({
    file: imageBuffer, // image buffer, you also can specify image from your disk using fs
    caption: caption, // nice caption (optional)
  });
}

export { translateEn, getRandomStyle, prepareImage, publishToInstagram };
