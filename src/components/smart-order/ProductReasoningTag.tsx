import React from 'react';

interface Effect {
  source: string;
  effect: number;
  reason: string;
}

interface ProductReasoningTagProps {
  festivalEffects?: Effect[];
  weatherEffects?: Effect[];
}

const ProductReasoningTag: React.FC<ProductReasoningTagProps> = ({
  festivalEffects,
  weatherEffects,
}) => {
  const allEffects = [
    ...(festivalEffects || []),
    ...(weatherEffects || []),
  ].filter(e => e.effect !== 1.0);

  if (allEffects.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-0.5">
      {allEffects.map((effect, i) => {
        const isPositive = effect.effect > 1;
        const pct = Math.abs(Math.round((effect.effect - 1) * 100));
        const arrow = isPositive ? '\u2191' : '\u2193';

        return (
          <span
            key={i}
            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${
              isPositive
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}
            title={effect.reason}
          >
            {effect.source}: {arrow}{pct}%
          </span>
        );
      })}
    </div>
  );
};

export default ProductReasoningTag;
