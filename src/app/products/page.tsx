'use client'

import { useState, useEffect } from "react";
import { getCategories, getProducts, createRecord, generateSmartId, deleteRecord } from "../actions";
import Link from "next/link";
import { Search, Filter, Star, ChevronRight, PackageSearch, Plus, X, Loader2, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProductList() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [selectedCat, setSelectedCat] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_name: '', category: '', brand: '', price: '', rating: 0
  });

  const refreshData = async () => {
    setLoading(true);
    const [cats, prods] = await Promise.all([
      getCategories(),
      getProducts(search, selectedCat)
    ]);
    setCategories(cats);
    setProducts(prods);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getProducts(search, selectedCat).then(data => setProducts(data));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search, selectedCat]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      setLoading(true);
      await deleteRecord('products', id);
      await refreshData();
      router.refresh();
    } catch (error) {
      alert("Failed to delete: " + error);
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const smartId = await generateSmartId('products', 'product_id');
      const productData = {
        product_id: smartId,
        product_name: newProduct.product_name,
        category: newProduct.category || 'General',
        brand: newProduct.brand || 'Generic',
        price: parseFloat(newProduct.price),
        rating: 0
      };
      await createRecord('products', productData);
      setIsModalOpen(false);
      setNewProduct({ product_name: '', category: '', brand: '', price: '', rating: 0 });
      refreshData();
      router.refresh();
    } catch (error) {
      alert("Failed to add product: " + error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">

      {/* Header & Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Product Catalog</h1>
          <p className="text-gray-500 mt-1">Manage inventory and view product details.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="group flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-2xl font-medium shadow-lg shadow-black/10 transition-all active:scale-95"
        >
          <div className="bg-white/20 p-1 rounded-full group-hover:bg-white/30 transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          Add New Product
        </button>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Search Products</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-72">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">Filter by Category</label>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none font-medium text-gray-700 cursor-pointer"
                value={selectedCat}
                onChange={(e) => setSelectedCat(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map((c: any) => (
                  <option key={c.category} value={c.category}>{c.category}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm font-medium">Loading products...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product Name</th>
                  <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Price</th>
                  <th className="p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Rating</th>
                  <th className="p-5 w-32 text-right">Actions</th> {/* Genişlik artırıldı */}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.length > 0 ? (
                  products.map((p: any) => (
                    <tr key={p.product_id} className="group hover:bg-blue-50/30 transition-colors duration-200">
                      <td className="p-5">
                        <div className="font-semibold text-gray-900">{p.product_name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">#{p.product_id}</div>
                      </td>

                      <td className="p-5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          {p.category}
                        </span>
                      </td>

                      <td className="p-5 text-right">
                        <div className="font-bold text-gray-900 tabular-nums">
                          ${p.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      <td className="p-5 text-center">
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-bold text-amber-700 tabular-nums">{p.rating || '0.0'}</span>
                        </div>
                      </td>

                      {/* ACTIONS COLUMN */}
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* DELETE BUTTON */}
                          <button
                            onClick={() => handleDelete(p.product_id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* DETAILS BUTTON */}
                          <Link
                            href={`/products/${p.product_id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm transition-all"
                            title="View Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                          <PackageSearch className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-gray-900 font-medium">No products found</h3>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Product</h2>
                <p className="text-sm text-gray-500 mt-1">Create a new item in your inventory.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Product Name</label>
                <input required type="text" placeholder="e.g. Wireless Headphones" className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" value={newProduct.product_name} onChange={e => setNewProduct({ ...newProduct, product_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Category</label>
                  <input list="cat-suggestions" required type="text" placeholder="Electronics" className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} />
                  <datalist id="cat-suggestions">{categories.map(c => <option key={c.category} value={c.category} />)}</datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Price ($)</label>
                  <input required type="number" step="0.01" placeholder="0.00" className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Brand</label>
                <input type="text" placeholder="e.g. Sony" className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium" value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })} />
              </div>
              <div className="pt-4">
                <button type="submit" disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {isSaving ? 'Saving Product...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
