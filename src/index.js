/* tslint:disable:no-console */
import "dotenv/config";
import WomboDreamApi from "wombo-dream-api";
import {
  getRandomStyle,
  prepareImage,
  publishToInstagram,
  translateEn,
} from "./utils.js";

const TEMP_IMAGE_PATH = "./temp/image.jpg";

(async () => {
  try {
    const caption = "Son memoria. Son presente. ¿Dónde están?";
    const api = WomboDreamApi.buildDefaultInstance();
    const task = await api.generatePicture(
      await translateEn(caption),
      await getRandomStyle(api),
      (task) => {
        console.log(task.state, "stage", task.photo_url_list.length);
      }
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
