import React from 'react';
import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface WasteAIInsightProps {
  monthlySaving: number;
  savingPercent: number;
}

const WasteAIInsight: React.FC<WasteAIInsightProps> = ({ monthlySaving, savingPercent }) => {
  const navigate = useNavigate();

  return (
    <div
      className="rounded-xl p-6 border shadow-sm transition-all hover:shadow-md"
      style={{
        background: 'hsl(var(--insight-positive))',
        borderColor: 'hsl(var(--insight-positive-accent) / 0.3)',
      }}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-white/80 shrink-0">
          <Lightbulb className="h-6 w-6" style={{ color: 'hsl(var(--insight-positive-accent))' }} />
        </div>
        <div className="flex-1">
          <h3
            className="text-base font-semibold font-playfair mb-2"
            style={{ color: 'hsl(var(--insight-positive-text))' }}
          >
            AI-Powered Insight
          </h3>
          <p className="text-sm font-rubik leading-relaxed mb-4" style={{ color: 'hsl(var(--insight-positive-text))' }}>
            Switching to forecast-based ordering could save you{' '}
            <span className="font-semibold">₹{(monthlySaving || 0).toLocaleString('en-IN')}/month</span>{' '}
            ({savingPercent}% of spend). Our demand forecasting model uses 2 years of your order
            history to predict daily quantities with 92% accuracy.
          </p>
          <Button
            onClick={() => navigate('/ai-forecast')}
            className="button-modern bg-farmaze-green hover:bg-farmaze-green/90 text-white"
          >
            Try Forecast-Based Ordering
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WasteAIInsight;
