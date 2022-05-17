/* tslint:disable:no-console */
import "dotenv/config";
import { readFileSync } from "fs";
import { Iconv } from "iconv";
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

const INPUT_IMAGE_WEIGHT = ["LOW", "MEDIUM"]; // No HIGH

(async () => {
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
    if (true) {
      person = people[random(0, people.length - 1)];
      weight = INPUT_IMAGE_WEIGHT[random(0, INPUT_IMAGE_WEIGHT.length - 1)];
      const sanitizedPath = new Iconv("ISO-8859-1", "UTF-8")
        .convert(person.image)
        .toString();
      const sourcePath = path.join(process.cwd(), sanitizedPath);
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
    const imageDescription = `"${caption.text}" - Año ${caption.year}.\n${
      person
        ? `\nDesaparecidx: ${
            person.name
          }.\nPeso en la imagen: ${weight.toLowerCase()}.`
        : ""
    }\nEstilo: ${style.name}.\n\n#marchadelsilencio2022`;

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
