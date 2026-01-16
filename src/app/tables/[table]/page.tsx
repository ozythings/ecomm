import { getTableData, getTableSchema, getTableReferences } from "../../actions";
import TableClient from "./client-view";

export default async function TableView({
  params,
  searchParams
}: {
  params: Promise<{ table: string }>,
  searchParams: Promise<{ page?: string, limit?: string, query?: string }>
}) {
  const { table } = await params;
  const resolvedSearchParams = await searchParams;

  const page = parseInt(resolvedSearchParams.page || '1');
  const limit = parseInt(resolvedSearchParams.limit || '50');
  const query = resolvedSearchParams.query || '';

  const [tableData, schema, references] = await Promise.all([
    getTableData(table, page, limit, query),
    getTableSchema(table),
    getTableReferences(table)
  ]);

  if (!schema || schema.length === 0) {
    return <div className="p-10 text-center text-gray-500">Table {table} does not exist.</div>;
  }

  const columns = schema.map((col: any) => col.name);

  return (
    <TableClient
      table={table}
      data={tableData.data}
      columns={columns}
      schema={schema}
      references={references}
      total={tableData.total}
      page={page}
      limit={limit}
      initialSearch={query}
    />
  );
}
