import React from 'react';
import { useNavigate } from 'react-router-dom';

const ScanOrderButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/orders/scan')}
      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
    >
      <div className="w-4 h-4 border-2 border-current rounded-sm flex items-center justify-center">
        <div className="w-1.5 h-1.5 border border-current rounded-sm"></div>
      </div>
      Scan Order
    </button>
  );
};

export default ScanOrderButton;