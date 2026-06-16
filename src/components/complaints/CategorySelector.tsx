import React from 'react';
import { PackageX, AlertTriangle } from 'lucide-react';
import { ComplaintCategory, CATEGORY_LABELS } from '@/api/complaintApi';

interface CategorySelectorProps {
  value: ComplaintCategory | null;
  onChange: (category: ComplaintCategory) => void;
}

const CATEGORY_META: { key: ComplaintCategory; icon: React.ReactNode; description: string }[] = [
  {
    key: 'missing_items',
    icon: <PackageX size={20} />,
    description: 'Items not delivered or short quantity',
  },
  {
    key: 'damaged_spoiled',
    icon: <AlertTriangle size={20} />,
    description: 'Items arrived damaged, spoiled, or expired',
  },
];

const CategorySelector: React.FC<CategorySelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">What went wrong?</label>
      <div className="flex flex-col sm:flex-row gap-3">
        {CATEGORY_META.map(({ key, icon, description }) => {
          const isSelected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`
                flex items-center gap-3 flex-1 p-4 rounded-lg border-2 text-left transition-all duration-200
                ${isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className={`flex-shrink-0 ${isSelected ? 'text-primary' : 'text-gray-400'}`}>
                {icon}
              </div>
              <div>
                <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-gray-800'}`}>
                  {CATEGORY_LABELS[key]}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySelector;
