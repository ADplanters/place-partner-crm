import { redirect } from "next/navigation";

export default function CrmHomePage() {
  // 메인 접속 시 보안 관리자 경로로 즉시 리다이렉트합니다.
  redirect("/pp-manager");
}