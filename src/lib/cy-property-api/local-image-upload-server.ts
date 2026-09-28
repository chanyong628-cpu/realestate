import "server-only";

import { createLocalImageUploadHandler } from "./local-image-upload-handler";
import { uploadLocalPropertyImage } from "./local-image-upload";

export const localImageUploadHandler = createLocalImageUploadHandler({
  getSecret: () => process.env.CY_PROPERTY_API_SECRET,
  uploadImage: (folderName, fileName, buffer) =>
    uploadLocalPropertyImage(folderName, fileName, buffer),
});
