import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildDocumentViewerUrl,
  documentContentType,
  documentExtension,
  getDocumentKind,
} from "../src/lib/properties/document";

describe("property document helpers", () => {
  test("recognizes pdf and powerpoint files by extension", () => {
    assert.equal(getDocumentKind("https://x.co/a/b.PDF"), "pdf");
    assert.equal(getDocumentKind("https://x.co/a/b.pptx?token=1"), "powerpoint");
    assert.equal(getDocumentKind("b.ppt"), "powerpoint");
    assert.equal(getDocumentKind("b.docx"), null);
    assert.equal(getDocumentKind(null), null);
    assert.equal(documentExtension("https://x.co/a.b/c"), "");
  });

  test("maps extensions to upload content types", () => {
    assert.equal(documentContentType("pdf"), "application/pdf");
    assert.ok(documentContentType("pptx")?.includes("presentationml"));
    assert.equal(documentContentType("exe"), null);
  });

  test("builds viewer urls", () => {
    assert.equal(
      buildDocumentViewerUrl("https://x.co/a.pdf", "pdf"),
      "https://x.co/a.pdf#view=FitH",
    );
    assert.equal(
      buildDocumentViewerUrl("https://x.co/a b.pptx", "powerpoint"),
      "https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fx.co%2Fa%20b.pptx",
    );
  });
});
