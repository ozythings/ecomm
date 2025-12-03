import { getTableData } from "../../actions";

export default async function TableView({ params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;

  const data = await getTableData(table);

  if (!data || data.length === 0) {
    return <div className="p-8">No data found in table {table}</div>;
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold capitalize">{table} <span className="text-lg font-normal text-slate-400">Raw Data</span></h1>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                {columns.map(col => (
                  <th key={col} className="p-3 text-left font-semibold uppercase text-xs tracking-wider">{col.replace('_', ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row: any, i: number) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                  {columns.map(col => (
                    <td key={col} className="p-3 whitespace-nowrap">{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
