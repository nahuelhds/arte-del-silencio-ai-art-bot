/* tslint:disable:no-console */
import "dotenv/config";
import WomboDreamApi from "wombo-dream-api";
import {
  getRandomStyle,
  prepareImage,
  publishToInstagram,
  publishToTwitter,
  translateEn,
} from "./utils.js";
import { readFileSync } from "fs";
import random from "lodash.random";
import captions from "../data/captions.js";
import people from "../data/people.js";

const TEMP_IMAGE_PATH = "./temp/image.jpg";
const INPUT_IMAGE_WEIGHT = ["LOW", "MEDIUM"]; // No HIGH

(async () => {
  try {
    const caption = captions[random(0, captions.length - 1)];
    console.info(
      `Building image with caption from year ${caption.year}: "${caption.text}"`
    );

    const api = WomboDreamApi.buildDefaultInstance();

    let person, weight, inputImage;
    if (random()) {
      person = people[random(0, people.length - 1)];
      weight = INPUT_IMAGE_WEIGHT[random(0, INPUT_IMAGE_WEIGHT.length - 1)];
      const sourcePath = person.image;
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

    const imageBuffer = await prepareImage(task.result.final, TEMP_IMAGE_PATH);
    const imageDescription = `"${caption.text}" - Año ${caption.year}.\n${
      person
        ? `\nDesaparecidx: ${
            person.name
          }.\nPeso en la imagen: ${weight.toLowerCase()}.`
        : ""
    }\nEstilo: ${style.name}.\n\n#marchadelsilencio2022`;

    await publishToTwitter(imageBuffer, imageDescription);
    console.info("Successfully published to Twitter .");
    await publishToInstagram(imageBuffer, imageDescription);
    console.info("Successfully published to Instagram.");
  } catch (err) {
    console.error("An error occurred in the process", err);
  }
})();
