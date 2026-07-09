type Column<T> = {
  key: keyof T;
  label: string;
  numeric?: boolean;
};

export function DataTable<T extends Record<string, string>>({
  columns,
  rows
}: {
  columns: readonly Column<T>[];
  rows: T[];
}) {
  return (
    <div className="data-table-wrap" aria-label="예시 비교 데이터">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className={column.numeric ? "data-table__numeric" : undefined}
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
