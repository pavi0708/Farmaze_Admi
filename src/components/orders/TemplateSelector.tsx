import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileText, Trash2, ChevronDown, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import templateApi, { OrderTemplate, OrderTemplateItem } from '@/api/templateApi';

interface TemplateSelectorProps {
  onSelect: (items: OrderTemplateItem[]) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect }) => {
  const [templates, setTemplates] = useState<OrderTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await templateApi.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch templates when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const handleSelect = (template: OrderTemplate) => {
    onSelect(template.items);
    toast.success(`Template "${template.name}" loaded`, {
      description: `${template.items.length} item${template.items.length !== 1 ? 's' : ''} added to cart`,
    });
    setIsOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, templateId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteId(templateId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await templateApi.deleteTemplate(deleteId);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteId));
      toast.success('Template deleted');
    } catch (error) {
      toast.error('Failed to delete template');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <FileText size={16} />
            My Templates
            <ChevronDown size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Saved Templates</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 size={16} className="mr-2 animate-spin" />
              Loading...
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Package size={24} className="mb-2 opacity-50" />
              <p className="text-sm">No templates saved yet</p>
              <p className="text-xs mt-1">Save your cart as a template for quick reordering</p>
            </div>
          ) : (
            templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                className="flex items-center justify-between cursor-pointer py-3"
                onSelect={(e) => {
                  e.preventDefault();
                  handleSelect(template);
                }}
              >
                <div className="flex flex-col flex-1 mr-2 min-w-0">
                  <span className="font-medium text-sm truncate">{template.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {template.items.length} item{template.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 shrink-0"
                  onClick={(e) => handleDeleteClick(e, template.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TemplateSelector;
