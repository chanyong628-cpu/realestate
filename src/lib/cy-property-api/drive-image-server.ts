import "server-only";

import { createDriveImageImportHandler } from "./drive-image-handler";
import { importGoogleDrivePropertyImages } from "./drive-image-import";

export const driveImageImportHandler = createDriveImageImportHandler({
  getSecret: () => process.env.CY_PROPERTY_API_SECRET,
  importFolder: importGoogleDrivePropertyImages,
});
