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
    console.info(`Building image with caption: "${caption}"`);

    const api = WomboDreamApi.buildDefaultInstance();

    let inputImage;
    if (random()) {
      const sourcePath = "./assets/example.jpg";
      const uploadedImageInfo = await api.uploadImage(readFileSync(sourcePath));
      const weight = INPUT_IMAGE_WEIGHT[random(0, 2)];
      inputImage = {
        mediastore_id: uploadedImageInfo.id,
        weight,
      };
      console.info(`Using base image "${sourcePath}" and weight "${weight}"`);
    } else {
      console.info(`Without base image`);
    }
    const task = await api.generatePicture(
      await translateEn(caption),
      await getRandomStyle(api),
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
    await publishToInstagram(imageBuffer, caption);
    console.info("Published to Instagram account successfully");
  } catch (err) {
    console.error("An error occurred in the process", err);
  }
})();
