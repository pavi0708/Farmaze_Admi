import api from './authApi';

// ── Types ──────────────────────────────────────────────────────────────

export type ComplaintCategory =
  | 'missing_items'
  | 'damaged_spoiled';

export type ComplaintStatus =
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export interface ComplaintItem {
  order_detail_id: string;
  product_id: string;
  product_name: string;
  quantity_ordered: number;
  unit: string;
}

export interface ComplaintImage {
  id: string;
  image_url: string;
  file_name: string;
  file_size: number;
  uploaded_at: string;
}

export interface ComplaintSummary {
  complaint_id: string;
  complaint_number: string;
  order_id: string;
  order_number: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  description: string;
  items: ComplaintItem[];
  images_count: number;
  created_at: string;
  updated_at: string;
  resolution_notes?: string;
  resolved_at?: string;
}

export interface ComplaintDetail extends ComplaintSummary {
  images: ComplaintImage[];
  resolved_by?: string;
  status_history: {
    status: ComplaintStatus;
    timestamp: string;
    note?: string;
  }[];
}

export interface CreateComplaintRequest {
  order_id: string;
  category: ComplaintCategory;
  description: string;
  items: { order_detail_id: string; product_id: string; affected_quantity: number }[];
}

export interface CreateComplaintResponse {
  complaint_id: string;
  complaint_number: string;
}

// ── Category / Status display helpers ──────────────────────────────────

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  missing_items: 'Missing Items',
  damaged_spoiled: 'Damaged / Spoiled',
};

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const STATUS_COLORS: Record<ComplaintStatus, string> = {
  submitted: 'bg-blue-100 text-blue-800 border-blue-300',
  under_review: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  in_progress: 'bg-orange-100 text-orange-800 border-orange-300',
  resolved: 'bg-green-100 text-green-800 border-green-300',
  closed: 'bg-gray-100 text-gray-800 border-gray-300',
};

// ── API Functions ─────────────────────────────────────────────────────

const complaintApi = {
  /** Create a new complaint */
  createComplaint: async (request: CreateComplaintRequest): Promise<CreateComplaintResponse> => {
    const response = await api.post('/b2bclients/complaints', request);
    return response.data;
  },

  /** List all complaints for current client */
  getComplaints: async (status?: ComplaintStatus): Promise<ComplaintSummary[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/b2bclients/complaints${params}`);
    return response.data.complaints ?? [];
  },

  /** Get complaint detail by ID */
  getComplaintById: async (complaintId: string): Promise<ComplaintDetail> => {
    const response = await api.get(`/b2bclients/complaints/${complaintId}`);
    return response.data;
  },

  /** Get complaints for a specific order */
  getComplaintsByOrderId: async (orderId: string): Promise<ComplaintSummary[]> => {
    const response = await api.get(`/b2bclients/complaints?order_id=${orderId}`);
    return response.data.complaints ?? [];
  },

  /** Upload complaint images (returns URLs) */
  uploadComplaintImages: async (complaintId: string, files: File[]): Promise<ComplaintImage[]> => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    const response = await api.post(`/b2bclients/complaints/${complaintId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.images;
  },

  /** Get open complaint count (for nav badge) */
  getOpenComplaintCount: async (): Promise<number> => {
    const response = await api.get('/b2bclients/complaints/count');
    return response.data.count;
  },
};

export default complaintApi;
