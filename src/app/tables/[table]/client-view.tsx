'use client'

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  Plus, Pencil, Trash2, X, Save 
} from "lucide-react";
import { createRecord, updateRecord, deleteRecord } from "../../actions";

interface TableClientProps {
  table: string;
  data: any[];
  columns: string[];
  schema: any[];
  total: number;
  page: number;
  limit: number;
}

export default function TableClient({ 
  table, data, columns, schema, total, page, limit 
}: TableClientProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / limit);
  const primaryKey = schema.find((col: any) => col.pk === 1)?.name || columns[0];

  // State for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  // --- Handlers ---

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({});
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this record? This cannot be undone.")) return;
    try {
      await deleteRecord(table, id);
      router.refresh();
    } catch (e) {
      alert("Failed to delete record: " + e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingItem) {
        await updateRecord(table, editingItem[primaryKey], formData);
      } else {
        await createRecord(table, formData);
      }
      setIsModalOpen(false);
      router.refresh(); // Refresh server data
    } catch (err) {
      alert("Error saving record: " + err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (col: string, value: string) => {
    setFormData(prev => ({ ...prev, [col]: value }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       
       {/* Header & Controls */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
           <h1 className="text-3xl font-bold capitalize text-gray-900">{table}</h1>
           <p className="text-gray-500 mt-1">Raw Data • {total.toLocaleString()} records</p>
         </div>
         
         <div className="flex items-center gap-3">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-medium uppercase">Show</span>
              {[50, 100, 1000].map(size => (
                <Link
                  key={size}
                  href={`/tables/${table}?page=1&limit=${size}`}
                  className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                    limit === size 
                      ? 'bg-black text-white' 
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {size}
                </Link>
              ))}
            </div>

            {/* Add Button */}
            <button 
              onClick={handleAddNew}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Record
            </button>
         </div>
       </div>
       
       {/* Data Table */}
       <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100/50 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
             <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100 backdrop-blur-sm sticky top-0">
               <tr>
                 {columns.map(col => (
                   <th key={col} className="p-4 font-semibold uppercase text-[11px] tracking-wider whitespace-nowrap">
                     {col.replace('_', ' ')}
                   </th>
                 ))}
                 <th className="p-4 w-20 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
               {data.map((row: any, i: number) => (
                 <tr key={i} className="group hover:bg-blue-50/30 transition-colors">
                   {columns.map(col => (
                     <td key={col} className="p-4 whitespace-nowrap text-gray-700 font-medium group-hover:text-gray-900">
                       {typeof row[col] === 'string' && row[col].length > 40 
                         ? row[col].substring(0, 40) + '...' 
                         : row[col]}
                     </td>
                   ))}
                   <td className="p-4 text-right">
                     <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(row)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(row[primaryKey])}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>

         {/* Pagination Footer */}
         <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="text-sm text-gray-500">
             Showing <span className="font-medium text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-medium text-gray-900">{Math.min(page * limit, total)}</span> of <span className="font-medium text-gray-900">{total}</span>
           </div>

           <div className="flex items-center gap-2">
             <PaginationLink 
               href={`/tables/${table}?page=1&limit=${limit}`} 
               disabled={page <= 1}
               icon={<ChevronsLeft className="w-4 h-4" />}
             />
             <PaginationLink 
               href={`/tables/${table}?page=${page - 1}&limit=${limit}`} 
               disabled={page <= 1}
               icon={<ChevronLeft className="w-4 h-4" />}
             />
             
             <span className="text-sm font-medium text-gray-700 px-3 bg-white border border-gray-200 rounded-md py-1">
               Page {page} of {totalPages}
             </span>

             <PaginationLink 
               href={`/tables/${table}?page=${page + 1}&limit=${limit}`} 
               disabled={page >= totalPages}
               icon={<ChevronRight className="w-4 h-4" />}
             />
             <PaginationLink 
               href={`/tables/${table}?page=${totalPages}&limit=${limit}`} 
               disabled={page >= totalPages}
               icon={<ChevronsRight className="w-4 h-4" />}
             />
           </div>
         </div>
       </div>

       {/* CRUD Modal */}
       {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h3 className="font-bold text-lg text-gray-900">
                 {editingItem ? `Edit ${table} Record` : `Add New ${table} Record`}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {schema.map((col: any) => (
                  <div key={col.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {col.name.replace(/_/g, ' ')} {col.pk === 1 && <span className="text-blue-500 text-xs">(PK)</span>}
                    </label>
                    <input 
                      type={col.type === 'INTEGER' || col.type === 'REAL' ? 'number' : 'text'}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder={`Enter ${col.name}...`}
                      value={formData[col.name] || ''}
                      onChange={(e) => handleInputChange(col.name, e.target.value)}
                      readOnly={col.pk === 1 && editingItem} // Prevent editing PK on update
                      disabled={col.pk === 1 && editingItem}
                    />
                  </div>
                ))}
             </form>

             <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
               <button 
                 type="button" 
                 onClick={() => setIsModalOpen(false)}
                 className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200/50 rounded-lg transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleSubmit}
                 disabled={isLoading}
                 className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
               >
                 <Save className="w-4 h-4" />
                 {isLoading ? 'Saving...' : 'Save Record'}
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}

function PaginationLink({ href, disabled, icon }: { href: string; disabled: boolean; icon: React.ReactNode }) {
  if (disabled) {
    return (
      <button disabled className="p-2 rounded-lg text-gray-300 cursor-not-allowed">
        {icon}
      </button>
    );
  }
  return (
    <Link 
      href={href} 
      className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all"
    >
      {icon}
    </Link>
  );
}
