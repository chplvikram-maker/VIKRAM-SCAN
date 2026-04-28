export interface Product {
  barcode: string;
  name: string;
  category: string;
  uom: string;
}

export interface HistoryEntry {
  date: string;
  barcode: string;
  name: string;
  category: string;
  quantity: number;
  uom: string;
}

export interface PendingSync {
  id: string;
  data: {
    username: string;
    barcode: string;
    name: string;
    category: string;
    quantity: number;
    uom: string;
  };
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  product?: T;
  history?: T[];
  error?: string;
}
