import { comparisonRows } from "@/data/landingContent";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";

const columns = [
  { key: "area", label: "구분" },
  { key: "size", label: "면적", numeric: true },
  { key: "price", label: "거래 단가", numeric: true },
  { key: "zoning", label: "용도지역" }
] as const;

export function CompareTableMockup() {
  return (
    <Card className="compare-card">
      <div className="parcel-panel__header">
        <div>
          <p className="eyebrow">비교표 예시</p>
          <h3>주변 거래와 같은 기준으로 보기</h3>
        </div>
        <Badge variant="neutral">예시 데이터</Badge>
      </div>
      <DataTable columns={columns} rows={comparisonRows} />
      <p className="mock-note">
        예시 가격은 화면 구성을 설명하기 위한 값이며 실제 조회 결과가 아닙니다.
      </p>
    </Card>
  );
}
