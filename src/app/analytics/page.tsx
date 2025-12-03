'use client'

import { useEffect, useState } from 'react';
import { getGraphData } from '../actions';
import dynamic from 'next/dynamic';

// for disabling ssr
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Analytics() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getGraphData().then(setData);
  }, []);

  if (!data) return <div>Loading Charts...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales Chart */}
        <div className="card min-h-[450px]">
          <h3 className="font-semibold mb-2">Top Selling Products</h3>
          <div className="w-full h-full">
            <Plot
              data={[
                {
                  x: data.sales.map((d: any) => d.product_name),
                  y: data.sales.map((d: any) => d.total_sold),
                  type: 'bar',
                  marker: { color: '#4f46e5' },
                },
              ]}
              layout={{ 
                autosize: true, 
                title: '',
                margin: { t: 20, b: 100, l: 50, r: 20 },
                xaxis: { tickangle: -45 }
              }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </div>
        </div>

        {/* Reviews Chart */}
        <div className="card min-h-[450px]">
          <h3 className="font-semibold mb-2">Rating Distribution</h3>
          <div className="w-full h-full">
            <Plot
              data={[
                {
                  values: data.ratings.map((d: any) => d.count),
                  labels: data.ratings.map((d: any) => `${d.rating} Stars`),
                  type: 'pie',
                  marker: { colors: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'] },
                },
              ]}
              layout={{ 
                autosize: true, 
                title: '',
                margin: { t: 20, b: 20, l: 20, r: 20 }
              }}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
