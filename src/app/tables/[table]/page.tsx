import { getTableData, getTableSchema } from "../../actions";
import TableClient from "./client-view";

export default async function TableView({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ table: string }>,
  searchParams: Promise<{ page?: string, limit?: string }> 
}) {
  const { table } = await params;
  const resolvedSearchParams = await searchParams;
  
  const page = parseInt(resolvedSearchParams.page || '1');
  const limit = parseInt(resolvedSearchParams.limit || '50');

  // Fetch Data & Schema in parallel
  const [tableData, schema] = await Promise.all([
    getTableData(table, page, limit),
    getTableSchema(table)
  ]);

  if (!schema || schema.length === 0) {
    return <div className="p-10 text-center text-gray-500">Table {table} does not exist or is inaccessible.</div>;
  }

  // If table is empty, we still need columns from schema for the Add Form
  const columns = schema.map((col: any) => col.name);

  return (
    <TableClient 
      table={table}
      data={tableData.data}
      columns={columns}
      schema={schema}
      total={tableData.total}
      page={page}
      limit={limit}
    />
  );
}
