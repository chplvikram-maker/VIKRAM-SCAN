export interface Product {
  barcode: string;
  name: string;
  category: string;
  uom: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  barcode: string;
  name: string;
  category: string;
  quantity: number;
  uom: string;
  type: 'IN' | 'OUT' | 'AUDIT';
  remarks?: string;
}

export interface PendingSync {
  id: string;
  action: 'submit_entry' | 'update_last_entry';
  data: {
    username: string;
    barcode: string;
    name: string;
    category: string;
    quantity: number;
    uom: string;
    type: 'IN' | 'OUT' | 'AUDIT';
    remarks?: string;
  };
  timestamp: string;
  attempts?: number;
  lastError?: string;
  status?: 'pending' | 'syncing' | 'failed';
}

export interface ApiResponse<T> {
  success: boolean;
  product?: T;
  history?: T[];
  error?: string;
}
