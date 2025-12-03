'use client'

import { useState, useEffect } from "react";
import { getCategories, getProducts } from "../actions";
import Link from "next/link";
import { Search } from "lucide-react";

export default function ProductList() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    getProducts(search, selectedCat).then(setProducts);
  }, [search, selectedCat]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Product Catalog</h1>
      </div>

      <div className="card space-y-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Search (Name or ID)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-64">
             <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
             <select 
               className="w-full px-4 py-2 border rounded-lg"
               value={selectedCat}
               onChange={(e) => setSelectedCat(e.target.value)}
             >
               <option value="All">All Categories</option>
               {categories.map((c: any) => (
                 <option key={c.category} value={c.category}>{c.category}</option>
               ))}
             </select>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Rating</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => (
                <tr key={p.product_id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-medium">{p.product_name}</td>
                  <td className="p-3 text-slate-600">{p.category}</td>
                  <td className="p-3 font-semibold text-green-600">${p.price}</td>
                  <td className="p-3 text-yellow-600">★ {p.rating}</td>
                  <td className="p-3 text-right">
                    <Link 
                      href={`/products/${p.product_id}`}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <div className="p-8 text-center text-slate-500">No products found.</div>}
        </div>
      </div>
    </div>
  );
}
