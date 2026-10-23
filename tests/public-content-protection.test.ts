import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isBlockedPublicShortcut } from "../src/components/layout/public-content-protection";

function shortcut(
  key: string,
  modifiers: Partial<{
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
  }> = {},
) {
  return {
    altKey: false,
    ctrlKey: false,
    key,
    metaKey: false,
    shiftKey: false,
    ...modifiers,
  };
}

describe("C.Y 공개 페이지 콘텐츠 보호", () => {
  it("F12와 대표 개발자도구 단축키를 차단한다", () => {
    assert.equal(isBlockedPublicShortcut(shortcut("F12")), true);
    assert.equal(
      isBlockedPublicShortcut(
        shortcut("i", { ctrlKey: true, shiftKey: true }),
      ),
      true,
    );
    assert.equal(
      isBlockedPublicShortcut(shortcut("c", { metaKey: true, altKey: true })),
      true,
    );
  });

  it("소스 보기와 페이지 저장 단축키를 차단한다", () => {
    assert.equal(
      isBlockedPublicShortcut(shortcut("u", { ctrlKey: true })),
      true,
    );
    assert.equal(
      isBlockedPublicShortcut(shortcut("s", { ctrlKey: true })),
      true,
    );
  });

  it("일반 글자 입력과 복사는 차단하지 않는다", () => {
    assert.equal(isBlockedPublicShortcut(shortcut("F")), false);
    assert.equal(
      isBlockedPublicShortcut(shortcut("c", { ctrlKey: true })),
      false,
    );
  });
});
