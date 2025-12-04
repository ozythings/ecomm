'use client'

import { useEffect, useState, use } from "react";
import { getProductById, getProductReviews, getRelatedProducts } from "../../actions";
import { Star, Calendar, Tag, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    if (id) {
      getProductById(id).then(setProduct);
      getRelatedProducts(id).then(setRelated);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      getProductReviews(id, sort).then(setReviews);
    }
  }, [id, sort]);

  if (!product) return <div className="p-8">Loading...</div>;

  return (
    <div className="h-full flex flex-col space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{product.product_name}</h1>
        <p className="text-slate-500 text-sm">ID: {product.product_id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">

        {/* LEFT COLUMN: Specs + Related Products */}
        <div className="lg:col-span-1 space-y-6">
          {/* Specs Card */}
          <div className="card">
            <h3 className="font-semibold text-slate-400 uppercase text-xs tracking-wider mb-4">Product Specs</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-500 block mb-1">Price</label>
                <div className="text-3xl font-bold text-green-600">${product.price}</div>
              </div>
              <div>
                <label className="text-sm text-slate-500 block mb-1">Category</label>
                <div className="flex items-center gap-2 font-medium"><Tag className="w-4 h-4" /> {product.category}</div>
              </div>
              <div>
                <label className="text-sm text-slate-500 block mb-1">Rating</label>
                <div className="flex items-center gap-1 text-yellow-600 font-bold"><Star className="w-5 h-5 fill-current" /> {product.rating} / 5.0</div>
              </div>
            </div>
          </div>

          {/* Related Products Card (Market Basket Analysis) */}
          <div className="card bg-indigo-50 border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-4">Frequently Bought Together</h3>
            <div className="space-y-3">
              {related.length > 0 ? related.map((p) => (
                <Link key={p.product_id} href={`/products/${p.product_id}`} className="block group">
                  <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm group-hover:shadow-md transition flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm text-slate-900 group-hover:text-indigo-600">{p.product_name}</div>
                      <div className="text-xs text-slate-500">${p.price}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                  </div>
                </Link>
              )) : (
                <p className="text-sm text-slate-500 italic">No correlation data yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Reviews */}
        <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
          <div className="card flex-1 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <h2 className="font-bold text-lg">Customer Reviews ({reviews.length})</h2>
              <select className="bg-slate-50 border rounded-lg px-3 py-1 text-sm outline-none" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating_high">Highest Rated</option>
                <option value="rating_low">Lowest Rated</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {reviews.map((r: any) => (
                <div key={r.review_id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        {r.user_name ? r.user_name.charAt(0) : '?'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{r.user_name}</div>
                        <div className="flex text-yellow-500 text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-current' : 'text-slate-300'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.review_date).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-slate-700 leading-relaxed pl-14">{r.review_text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
