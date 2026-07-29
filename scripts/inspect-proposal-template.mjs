import path from "node:path";
import automizerPackage from "pptx-automizer";

const { Automizer } = automizerPackage;

const templateDir = path.resolve("templates");
const automizer = new Automizer({
  templateDir,
  outputDir: path.resolve("outputs"),
  removeExistingSlides: true,
  autoImportSlideMasters: true,
  verbosity: 0,
});

const presentation = automizer
  .loadRoot("cy-rental-proposal.pptx")
  .load("cy-rental-proposal.pptx", "proposal");

const info = await presentation.getInfo();

for (let slideNumber = 1; slideNumber <= 4; slideNumber += 1) {
  const slide = info.slideByNumber("proposal", slideNumber);
  console.log(
    JSON.stringify(
      {
        slideNumber,
        elements: slide?.elements?.map((element) => ({
          name: element.name,
          type: element.type,
          text: element.text,
        })),
      },
      null,
      2,
    ),
  );
}
