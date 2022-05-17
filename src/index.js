/* tslint:disable:no-console */
import "dotenv/config";
import { readFileSync } from "fs";
import random from "lodash.random";
import path from "path";
import WomboDreamApi from "wombo-dream-api";

import captions from "../data/captions.js";
import people from "../data/people.js";
import {
  getRandomStyle,
  prepareImage,
  publishToInstagram,
  publishToTwitter,
  translateEn,
  verifyCredentials,
} from "./utils.js";

(async () => {
  const weightsTranslations = {
    LOW: "Bajo",
    MEDIUM: "Medio",
    HIGH: "Alto",
  };
  const weights = Object.keys(weightsTranslations);

  try {
    if (!(await verifyCredentials())) {
      return;
    }

    const caption = captions[random(0, captions.length - 1)];
    console.info(
      `Building image with caption from year ${caption.year}: "${caption.text}"`
    );

    const api = WomboDreamApi.buildDefaultInstance();

    let person, weight, inputImage;
    if (random()) {
      person = people[random(0, people.length - 1)];
      weight = weights[random(0, weights.length - 1)];
      const sourcePath = path.join(process.cwd(), person.image);
      const uploadedImageInfo = await api.uploadImage(readFileSync(sourcePath));
      inputImage = {
        mediastore_id: uploadedImageInfo.id,
        weight,
      };
      console.info(`Using base image "${sourcePath}" and weight "${weight}"`);
    } else {
      console.info(`Without base image`);
    }
    const style = await getRandomStyle(api);
    const task = await api.generatePicture(
      await translateEn(caption.text),
      style.id,
      (task) => {
        console.log(task.state, "stage", task.photo_url_list.length);
      },
      inputImage
    );
    if (!task?.result.final) {
      console.error("No image generated");
      return;
    }
    console.info("Image generated: ", task?.result.final);

    const imageBuffer = await prepareImage(task.result.final);
    const imageDescription = `"${caption.text}" - Consigna del año: ${
      caption.year
    }.\n\n${
      person
        ? `\nDesaparecidx: ${person.name}.\nPeso de la silueta: ${weightsTranslations[weight]}.`
        : ""
    }\nEstilo artístico: ${style.name}.\n\n#marchadelsilencio2022`;

    const twPost = await publishToTwitter(imageBuffer, imageDescription);
    console.info(
      "Successfully published to Twitter:",
      `https://twitter.com/${twPost.user.screen_name}/status/${twPost.id_str}`
    );
    const igPost = await publishToInstagram(imageBuffer, imageDescription);
    console.info(
      "Successfully published to Instagram:",
      `https://instagram.com/p/${igPost.media.code}/`
    );
  } catch (err) {
    console.error("An error occurred in the process", err);
  }
})();
