/* tslint:disable:no-console */
import "dotenv/config";
import WomboDreamApi from "wombo-dream-api";
import {
  getRandomStyle,
  prepareImage,
  publishToInstagram,
  translateEn,
} from "./utils.js";
import { readFileSync } from "fs";
import random from "lodash.random";
import captions from "../data/captions.js";
import people from "../data/people.js";

const TEMP_IMAGE_PATH = "./temp/image.jpg";
const INPUT_IMAGE_WEIGHT = ["LOW", "MEDIUM", "HIGH"];

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
      weight = INPUT_IMAGE_WEIGHT[random(0, 2)];
      const sourcePath = person.coloredImage;
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
      () => null,
      inputImage
    );
    if (!task?.result.final) {
      console.error("No image generated");
      return;
    }
    console.info("Image generated: ", task?.result.final);

    const imageBuffer = await prepareImage(task.result.final, TEMP_IMAGE_PATH);
    const imageDescription = `"${caption.text}" - Año ${
      caption.year
    }.\n\nEstilo: ${style.name}.\n${
      person ? `Persona: ${person.name}.\nPeso: ${weight.toLowerCase()}.` : ""
    }\n\n#marchadelsilencio2022`;

    await publishToInstagram(imageBuffer, imageDescription);
    console.info(
      "Published to Instagram account successfully.",
      imageDescription
    );
  } catch (err) {
    console.error("An error occurred in the process", err);
  }
})();
