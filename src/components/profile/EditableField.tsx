
import React from "react";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";

interface EditableFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onToggleEdit: () => void;
  onChange: (value: string) => void;
  type?: string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  isEditing,
  onToggleEdit,
  onChange,
  type = "text"
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!isEditing}
          className="pr-10 bg-white border-gray-200 focus:border-farmaze-orange focus:ring-1 focus:ring-farmaze-orange/20 transition-all"
        />
        <button 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-farmaze-orange transition-colors p-1 rounded-full hover:bg-gray-100"
          onClick={onToggleEdit}
        >
          <Pencil size={16} />
        </button>
      </div>
    </div>
  );
};

export default EditableField;
