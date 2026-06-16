import React from 'react';
import { CheckCircle, Clock, Package, Truck } from 'lucide-react';

interface OrderStatusStepperProps {
  status: string;
  createdDate: string;
  deliveredDate: string;
}

const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({ 
  status, 
  createdDate, 
  deliveredDate 
}) => {
  // Helper function to calculate estimated delivery date (next day)
  const getEstimatedDeliveryDate = (orderDate: string) => {
    const date = new Date(orderDate);
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Check if status is actually delivered
  const isActuallyDelivered = ['delivered', 'completed'].some(s => 
    status.toLowerCase().includes(s)
  );

  const steps = [
    {
      key: 'placed',
      title: 'Order Placed',
      icon: CheckCircle,
      date: createdDate,
      dateLabel: 'Order Date',
      isCompleted: true,
    },
    {
      key: 'delivered',
      title: 'Delivered',
      icon: CheckCircle,
      date: isActuallyDelivered ? deliveredDate : getEstimatedDeliveryDate(createdDate),
      dateLabel: isActuallyDelivered ? 'Delivery Date' : 'Estimated Delivery Date',
      isCompleted: ['delivered', 'completed'].some(s => 
        status.toLowerCase().includes(s)
      ),
    },
  ];

  return (
    <div className="w-full bg-white p-6 rounded-lg border shadow-sm">
      <h3 className="text-lg font-medium mb-6 text-center">Order Progress</h3>
      
      <div className="flex items-center justify-center gap-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.isCompleted;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.key} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isActive 
                      ? 'bg-farmaze-orange border-farmaze-orange text-white shadow-lg' 
                      : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}
                >
                  <Icon size={20} />
                </div>
                
                <div className="mt-3 text-center">
                  <p className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {step.date !== 'Pending' ? step.date : 'Pending'}
                  </p>
                </div>
              </div>
              
              {/* Progress Line between steps */}
              {!isLast && (
                <div className="flex items-center mx-4">
                  <div className="w-16 h-0.5 bg-gray-200 relative">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        steps[index + 1]?.isCompleted ? 'bg-farmaze-orange w-full' : 'bg-gray-200 w-0'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusStepper;