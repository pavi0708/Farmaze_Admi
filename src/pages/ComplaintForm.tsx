import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import CategorySelector from '@/components/complaints/CategorySelector';
import ItemSelector, { SelectedItem } from '@/components/complaints/ItemSelector';
import ImageUploader from '@/components/complaints/ImageUploader';
import complaintApi, {
  ComplaintCategory,
} from '@/api/complaintApi';
import orderApi from '@/api/orderApi';

interface ImageFile {
  file: File;
  preview: string;
}

const ComplaintForm: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [errors, setErrors] = useState<{ category?: string; items?: string }>({});

  const { data: orderSummary, isLoading: orderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderApi.getOrderById(orderId!),
    enabled: !!orderId,
  });

  const { data: orderItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['order-items', orderId],
    queryFn: () => orderApi.getOrderItems(orderId!, undefined, true),
    enabled: !!orderId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!orderId || !category) throw new Error('Missing required fields');

      const result = await complaintApi.createComplaint({
        order_id: orderId,
        category,
        description,
        items: selectedItems.map(si => {
          const oi = orderItems.find(o => o.id === si.id);
          return {
            order_detail_id: si.id,
            product_id: oi?.product_id ?? si.id,
            affected_quantity: si.quantity,
          };
        }),
      });

      // Upload images separately — don't fail the whole submission if images fail
      let imageUploadFailed = false;
      if (images.length > 0) {
        try {
          await complaintApi.uploadComplaintImages(
            result.complaint_id,
            images.map(img => img.file)
          );
        } catch (err) {
          console.error('Image upload failed:', err);
          imageUploadFailed = true;
        }
      }

      return { ...result, imageUploadFailed };
    },
    onSuccess: (result) => {
      if (result.imageUploadFailed) {
        toast({
          title: 'Complaint submitted',
          description: `${result.complaint_number} has been filed but images could not be uploaded. You can try adding them later.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Complaint submitted',
          description: `${result.complaint_number} has been filed successfully.`,
        });
      }
      navigate(`/complaints/${result.complaint_id}`);
    },
    onError: () => {
      toast({
        title: 'Failed to submit',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    const newErrors: typeof errors = {};
    if (!category) newErrors.category = 'Please select a category';
    if (selectedItems.length === 0) newErrors.items = 'Please select at least one item';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    submitMutation.mutate();
  };

  const isLoading = orderLoading || itemsLoading;

  return (
    <div className="container mx-auto py-6 px-4 max-w-xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 font-rubik"
        >
          <ArrowLeft size={16} />
          Back to order
        </button>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold font-playfair text-foreground">Report an Issue</h1>
          {isLoading ? (
            <Skeleton className="h-4 w-32 mt-1" />
          ) : (
            <p className="text-sm text-muted-foreground mt-0.5">
              Order #{orderSummary?.order_number ?? orderId}
            </p>
          )}
        </div>

        {/* Form sections */}
        <div className="space-y-6">
          {/* Category */}
          <div>
            <CategorySelector value={category} onChange={setCategory} />
            {errors.category && (
              <p className="text-sm text-destructive mt-1.5">{errors.category}</p>
            )}
          </div>

          {/* Item selector */}
          <div>
            {itemsLoading ? (
              <Skeleton className="h-20 w-full rounded-lg" />
            ) : (
              <ItemSelector
                orderItems={orderItems}
                selectedItems={selectedItems}
                onChange={setSelectedItems}
              />
            )}
            {errors.items && (
              <p className="text-sm text-destructive mt-1.5">{errors.items}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what went wrong..."
              className="rounded-lg border-border bg-muted/30 min-h-[100px] font-rubik text-sm focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Images */}
          <ImageUploader images={images} onChange={setImages} maxImages={5} />

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-medium text-base h-auto"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Submitting…
              </>
            ) : (
              'Submit Complaint'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ComplaintForm;
