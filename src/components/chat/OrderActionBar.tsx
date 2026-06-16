import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Pencil, X } from 'lucide-react';

interface OrderActionBarProps {
  onAction: (message: string) => void;
  disabled: boolean;
}

export default function OrderActionBar({ onAction, disabled }: OrderActionBarProps) {
  const [acted, setActed] = useState(false);

  const handle = (message: string) => {
    setActed(true);
    onAction(message);
  };

  const isDisabled = disabled || acted;

  return (
    <div className="flex items-center gap-2 mt-2">
      <Button
        size="sm"
        disabled={isDisabled}
        onClick={() => handle('Confirm all orders')}
        className="h-8 rounded-lg text-xs font-medium"
      >
        <CheckCircle2 size={14} className="mr-1.5" />
        Confirm Order
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isDisabled}
        onClick={() => handle('I want to modify the order')}
        className="h-8 rounded-lg text-xs font-medium"
      >
        <Pencil size={14} className="mr-1.5" />
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isDisabled}
        onClick={() => handle('Cancel this order')}
        className="h-8 rounded-lg text-xs font-medium text-destructive hover:text-destructive"
      >
        <X size={14} className="mr-1.5" />
        Cancel
      </Button>
    </div>
  );
}
