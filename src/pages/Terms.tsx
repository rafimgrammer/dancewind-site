// src/pages/Terms.tsx
import { PageHeader, Card } from "../components/Ui";

export default function Terms() {
  return (
    <div>
      <PageHeader eyebrow="Terms" title="이용약관" desc="춤바람 홈페이지 이용을 위한 약관입니다." />

      <Card className="space-y-6 text-sm leading-relaxed text-backstage/85">
        <section>
          <p className="font-display text-lg text-backstage">제1조 (목적)</p>
          <p className="mt-2 text-backstage/75">
            이 약관은 춤바람 홈페이지(이하 "사이트")가 제공하는 서비스의 이용 조건 및 절차,
            회원과 사이트의 권리·의무 등을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <p className="font-display text-lg text-backstage">제2조 (회원가입)</p>
          <p className="mt-2 text-backstage/75">
            회원가입은 구글 계정을 통한 로그인 및 필수 정보(이름, 학번, 학과, 가입 기수)
            입력으로 신청하며, 회장단의 승인을 거쳐 정식 회원으로 전환됩니다.
          </p>
        </section>

        <section>
          <p className="font-display text-lg text-backstage">제3조 (회원의 의무)</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-backstage/75">
            <li>회원은 가입 시 정확한 정보를 제공해야 합니다.</li>
            <li>회원은 타인의 계정을 도용하거나 부정하게 이용해서는 안 됩니다.</li>
            <li>
              게시판, 댓글 등 사이트 내 활동 시 타 회원을 비방하거나 불쾌감을 주는 행위를
              해서는 안 됩니다.
            </li>
            <li>사이트를 동아리 활동 목적 외의 용도로 이용해서는 안 됩니다.</li>
          </ul>
        </section>

        <section>
          <p className="font-display text-lg text-backstage">제4조 (게시물의 관리)</p>
          <p className="mt-2 text-backstage/75">
            회원이 작성한 게시물의 권리와 책임은 작성자 본인에게 있으며, 약관에 위반되는
            게시물은 회장단이 사전 통지 없이 삭제할 수 있습니다.
          </p>
        </section>

        <section>
          <p className="font-display text-lg text-backstage">제5조 (서비스의 변경 및 중단)</p>
          <p className="mt-2 text-backstage/75">
            사이트는 운영상, 기술상의 필요에 따라 제공하는 서비스의 내용을 변경하거나
            중단할 수 있습니다.
          </p>
        </section>

        <section>
          <p className="font-display text-lg text-backstage">제6조 (회원 탈퇴 및 자격 상실)</p>
          <p className="mt-2 text-backstage/75">
            회원은 언제든지 탈퇴를 요청할 수 있으며, 약관을 위반하거나 동아리 활동에 지장을
            주는 경우 회장단의 결정에 따라 자격이 제한되거나 상실될 수 있습니다.
          </p>
        </section>

        <p className="border-t border-line pt-4 font-mono text-xs text-mute">
          공고일자: 2026년 8월 2일 · 시행일자: 2026년 8월 2일
        </p>
      </Card>
    </div>
  );
}