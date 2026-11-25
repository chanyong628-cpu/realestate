import { redirect } from "next/navigation";

// 이 사이트는 매물만 등록한다. 예전 "무엇을 등록할까요?" 선택 화면은 없애고 매물 등록으로 바로 보낸다.
export default function ContentTypePage() {
  redirect("/admin/properties/new");
}
