import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/database';
import { useAuth } from "@/hooks/useAuth";
import { Upload, X } from "lucide-react";

interface ReimbursementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
}

export const ReimbursementFormDialog: React.FC<ReimbursementFormDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  
  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    expense_date: "",
    description: "",
    business_purpose: "",
  });

  React.useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      console.log("Fetching expense categories...");
      const { data, error } = await supabase
        .from("expense_categories")
        .select("id, name, description")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
      
      console.log("Categories fetched:", data);
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to load expense categories",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const uploadFiles = async (reimbursementId: string) => {
    if (!selectedFiles || !user) return;

    const uploadPromises = Array.from(selectedFiles).map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${reimbursementId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await db.storage
        .from('receipts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save file info to database
      const { error: dbError } = await supabase
        .from('reimbursement_attachments')
        .insert({
          reimbursement_id: reimbursementId,
          file_name: file.name,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
        });

      if (dbError) throw dbError;
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create reimbursement request
      const { data: reimbursement, error: reimbursementError } = await supabase
        .from("reimbursement_requests")
        .insert({
          employee_id: user.id,
          category_id: formData.category_id,
          amount: parseFloat(formData.amount),
          expense_date: formData.expense_date,
          description: formData.description,
          business_purpose: formData.business_purpose || null,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (reimbursementError) throw reimbursementError;

      // Upload files if any
      if (selectedFiles && selectedFiles.length > 0) {
        await uploadFiles(reimbursement.id);
      }

      toast({
        title: "Success",
        description: "Reimbursement request submitted successfully",
      });

      // Reset form
      setFormData({
        category_id: "",
        amount: "",
        expense_date: "",
        description: "",
        business_purpose: "",
      });
      setSelectedFiles(null);
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting reimbursement:", error);
      toast({
        title: "Error",
        description: "Failed to submit reimbursement request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Reimbursement Request</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category">Expense Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              required
            >
              <SelectTrigger className="bg-background border-input">
                <SelectValue placeholder="Select expense category" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border shadow-lg z-50 max-h-60 overflow-y-auto">
                {categories.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    {loading ? "Loading categories..." : "No categories available"}
                  </div>
                ) : (
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="hover:bg-muted cursor-pointer">
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{category.name}</span>
                        {category.description && (
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {category.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {categories.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {categories.length} categories available
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="expense_date">Expense Date</Label>
            <Input
              id="expense_date"
              type="date"
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What was this expense for?"
              required
            />
          </div>

          <div>
            <Label htmlFor="business_purpose">Business Purpose (Optional)</Label>
            <Textarea
              id="business_purpose"
              value={formData.business_purpose}
              onChange={(e) => setFormData({ ...formData, business_purpose: e.target.value })}
              placeholder="How does this relate to business activities?"
            />
          </div>

          <div>
            <Label htmlFor="receipts">Upload Receipts</Label>
            <div className="mt-2">
              <input
                id="receipts"
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('receipts')?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Receipts
              </Button>
              {selectedFiles && selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const dt = new DataTransfer();
                          Array.from(selectedFiles).forEach((f, i) => {
                            if (i !== index) dt.items.add(f);
                          });
                          setSelectedFiles(dt.files.length > 0 ? dt.files : null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};