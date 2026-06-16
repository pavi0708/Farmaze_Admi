import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Badge } from '@/components/ui/badge';

export interface ProductForecastDetail {
  productName: string;
  unit: string;
  avgLastYear: number;
  seasonalityNote: string;
  historicalData: { date: string; quantity: number }[];
  forecastData: { date: string; quantity: number }[];
}

interface ProductForecastAccordionProps {
  products: ProductForecastDetail[];
}

const MiniChart = ({ historical, forecast }: { historical: { date: string; quantity: number }[]; forecast: { date: string; quantity: number }[] }) => {
  // Combine historical and forecast data with a type marker
  const combined = [
    ...historical.map(d => ({ ...d, type: 'actual' as const, forecastQty: undefined as number | undefined })),
    ...forecast.map(d => ({ date: d.date, quantity: undefined as number | undefined, type: 'forecast' as const, forecastQty: d.quantity })),
  ];

  // We need to connect the lines, so the last historical point should also appear as first forecast point
  if (historical.length > 0 && forecast.length > 0) {
    const lastHistorical = historical[historical.length - 1];
    combined.splice(historical.length, 0, {
      date: lastHistorical.date,
      quantity: undefined,
      type: 'forecast',
      forecastQty: lastHistorical.quantity,
    });
  }

  return (
    <div className="w-full h-[160px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={combined} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: '#9ca3af', fontFamily: 'Rubik' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#9ca3af', fontFamily: 'Rubik' }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={{ fontFamily: 'Rubik', fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          {/* Vertical reference line at forecast start */}
          {forecast.length > 0 && (
            <ReferenceLine
              x={forecast[0].date}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
              label={{ value: 'Forecast →', position: 'top', fontSize: 9, fill: '#9ca3af', fontFamily: 'Rubik' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="quantity"
            stroke="hsl(217,91%,60%)"
            strokeWidth={1.5}
            dot={false}
            name="Actual"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecastQty"
            stroke="#16A34A"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={false}
            name="Forecast"
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const ProductForecastAccordion: React.FC<ProductForecastAccordionProps> = ({ products }) => {
  if (products.length === 0) return null;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="h-[3px] bg-gradient-to-r from-[#4A6FA5] to-[#4A6FA5]/30 -mt-6 -mx-6 mb-6 rounded-t-xl" />
      <h2 className="font-playfair text-lg font-medium text-foreground mb-1">Product-Level Forecast Detail</h2>
      <p className="text-sm text-muted-foreground font-rubik mb-4">Expand a product to see its 30-day history and 7-day forecast</p>

      <Accordion type="single" collapsible className="space-y-2">
        {products.map((product, idx) => (
          <AccordionItem key={idx} value={`product-${idx}`} className="border border-gray-100 rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3 text-left">
                <span className="font-rubik font-medium text-foreground">{product.productName}</span>
                <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs">
                  {product.unit}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <MiniChart historical={product.historicalData} forecast={product.forecastData} />
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-rubik text-muted-foreground">
                <span>📅 Same period last year: <span className="font-semibold text-foreground">{product.avgLastYear.toFixed(1)} {product.unit} avg</span></span>
                <span>🌿 {product.seasonalityNote}</span>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default ProductForecastAccordion;
