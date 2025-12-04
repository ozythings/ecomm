'use client'

import { useEffect, useState } from 'react';
import { getGraphData, getAdvancedStats } from '../actions';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [advanced, setAdvanced] = useState<any>(null);

  useEffect(() => {
    getGraphData().then(setData);
    getAdvancedStats().then(setAdvanced);
  }, []);

  if (!data || !advanced) return <div className="p-8">Loading Analytics...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Business Intelligence</h1>
      
      {/* 1. Monthly Revenue Trend (New) */}
      <div className="card min-h-[400px]">
        <h3 className="font-semibold mb-2 text-lg">Monthly Revenue Trend</h3>
        <p className="text-sm text-slate-500 mb-4">Revenue aggregation over time using <code>strftime</code>.</p>
        <div className="w-full h-full">
          <Plot
            data={[
              {
                x: advanced.monthlyRevenue.map((d: any) => d.month),
                y: advanced.monthlyRevenue.map((d: any) => d.revenue),
                type: 'scatter',
                mode: 'lines+markers',
                marker: { color: '#2563eb' },
                line: { width: 3 }
              },
            ]}
            layout={{ 
              autosize: true, 
              margin: { t: 20, b: 50, l: 60, r: 20 },
              xaxis: { title: 'Month' },
              yaxis: { title: 'Revenue ($)' }
            }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </div>
      </div>

      {/* 2. Sales Funnel (New) */}
      <div className="card min-h-[400px]">
        <h3 className="font-semibold mb-2 text-lg">Conversion Funnel</h3>
        <p className="text-sm text-slate-500 mb-4">Unique users from <code>events</code> (View/Cart) to <code>orders</code> (Purchase).</p>
        <div className="w-full h-full">
          <Plot
            data={[
              {
                y: advanced.funnel.map((d: any) => d.stage),
                x: advanced.funnel.map((d: any) => d.count),
                type: 'bar',
                orientation: 'h',
                marker: { color: ['#93c5fd', '#60a5fa', '#2563eb'] },
              },
            ]}
            layout={{ 
              autosize: true, 
              margin: { t: 20, b: 50, l: 100, r: 20 },
              xaxis: { title: 'Unique Users' }
            }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </div>
      </div>

      {/* 3. Category Performance */}
      <div className="card min-h-[450px]">
        <h3 className="font-semibold mb-2 text-lg">Revenue by Category</h3>
        <div className="w-full h-full">
          <Plot
            data={[
              {
                x: data.categoryStats.map((d: any) => d.category),
                y: data.categoryStats.map((d: any) => d.revenue),
                type: 'bar',
                marker: { color: '#10b981' },
              },
            ]}
            layout={{ 
              autosize: true, 
              margin: { t: 20, b: 100, l: 60, r: 20 },
              xaxis: { tickangle: -45, title: 'Category' },
              yaxis: { title: 'Revenue ($)' }
            }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. User Distribution */}
        <div className="card min-h-[400px]">
          <h3 className="font-semibold mb-2">User Hotspots</h3>
          <div className="w-full h-full">
            <Plot
              data={[
                {
                  values: data.citySegments.map((d: any) => d.user_count),
                  labels: data.citySegments.map((d: any) => d.city),
                  type: 'pie',
                  hole: 0.4,
                },
              ]}
              layout={{ 
                autosize: true, 
                showlegend: true,
                margin: { t: 20, b: 20, l: 20, r: 20 }
              }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </div>
        </div>

        {/* 5. Dead Inventory */}
        <div className="card min-h-[400px] overflow-hidden">
          <h3 className="font-semibold mb-2 text-red-600">Dead Inventory (Unsold)</h3>
          <p className="text-xs text-slate-500 mb-4">Left Join Null Check</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-50 text-red-800">
                <tr>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {data.deadInventory.map((p: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3 font-medium">{p.product_name}</td>
                    <td className="p-3 text-slate-500">{p.category}</td>
                    <td className="p-3 text-right">${p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
