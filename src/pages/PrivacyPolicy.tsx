// src/pages/PrivacyPolicy.tsx
import { PageHeader, Card } from "../components/Ui";

export default function PrivacyPolicy() {
  return (
    <div>
      <PageHeader
        eyebrow="Privacy Policy"
        title="개인정보처리방침"
        desc="춤바람은 회원 여러분의 개인정보를 소중히 다룹니다."
      />

      <Card className="space-y-6 text-sm leading-relaxed text-backstage/85">
        <section>
          <p className="font-display text-lg text-backstage">1. 수집하는 개인정보 항목</p>
          <p className="mt-2">
            춤바람은 회원가입 및 원활한 동아리 운영을 위해 아래 정보를 수집합니다.
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-backstage/75">
            <li>구글 이메일 주소 (로그인 및 본인 확인용)</li>
            <li>이름</li>
            <li>학번</li>
            <li>학과</li>
            <li>춤바람 가입 기수</li>
          </ul>
        </section>

        <section>
          <p className="font-display text-lg text-backstage">2. 개인정보의 수집 및 이용 목적</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-backstage/75">
            <li>회원 본인 확인 및 로그인 서비스 제공</li>
            <li>공지사항, 연습 일정 등 동아리 활동 관련 안내</li>
            <li>티칭 클래스 신청, 연습시간 조율 등 동아리 내부 기능 운영</li>
            <li>회원 관리 (가입, 탈퇴, 기수별 명단 관리 등)</li>
          </ul>
        </section>

        <section>
          <p className="font-display text-lg text-backstage">3. 개인정보의 보유 및 이용 기간</p>
          <p className="mt-2 text-backstage/75">
            회원 탈퇴 시 또는 동아리 활동 종료 시까지 보관하며, 탈퇴 요청 시 지체 없이
            파기합니다. 단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 법령에서 정한 기간
            동안 보관할 수 있습니다.
          </p>
        </section>

        <section>
          <p className="font-display text-lg text-backstage">4. 개인정보의 제3자 제공</p>
          <p className="mt-2 text-backstage/75">
            춤바람은 회원의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 회원이
            사전에 동의한 경우, 또는 법령에 특별한 규정이 있는 경우는 예외로 합니다.
          </p>
        </section>

        <section>
          <p className="font-display text-lg text-backstage">5. 개인정보의 안전성 확보 조치</p>
          <p className="mt-2 text-backstage/75">
            춤바람은 회원의 개인정보가 분실, 도난, 유출, 변조되지 않도록 합리적인 보안 조치를
            취하고 있으며, 회원 본인 외에는 개인정보에 접근할 수 없도록 관리하고 있습니다.
          </p>
        </section>

        <section>
          <p className="font-display text-lg text-backstage">6. 회원의 권리</p>
          <p className="mt-2 text-backstage/75">
            회원은 언제든지 본인의 개인정보를 조회, 수정, 삭제하거나 회원 탈퇴를 요청할 수
            있습니다. 아래 문의처를 통해 요청해주시면 신속히 처리해드립니다.
          </p>
        </section>

        <section>
          <p className="font-display text-lg text-backstage">7. 문의처</p>
          <p className="mt-2 text-backstage/75">
            개인정보 관련 문의사항은 아래로 연락해주세요.
            <br />
            담당: 춤바람 회장단
            <br />
            이메일: (여기에 실제 연락처를 입력해주세요)
          </p>
        </section>

        <p className="border-t border-line pt-4 font-mono text-xs text-mute">
          공고일자: 2026년 8월 2일 · 시행일자: 2026년 8월 2일
        </p>
      </Card>
    </div>
  );
}