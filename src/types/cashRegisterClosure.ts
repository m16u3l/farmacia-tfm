export type ClosureStatus = 'closed' | 'cancelled';

export const CLOSURE_STATUS_LABELS: Record<ClosureStatus, string> = {
  closed: 'Cerrado',
  cancelled: 'Anulado',
};

export interface CashRegisterClosure {
  closure_id: number;
  user_id: number | null;
  user_name?: string; // For joined queries
  period_start: string;
  period_end: string;
  status: ClosureStatus;
  sell_count: number;
  total_amount: number;
  total_efectivo: number;
  total_qr_transferencia: number;
  counted_cash: number;
  cash_difference: number;
  notes?: string | null;
  closed_at: string;
  cancelled_by?: number | null;
  cancelled_at?: string | null;
}

export interface CashRegisterClosureWithSells extends CashRegisterClosure {
  sells: { sell_id: number; sell_date: string; total_amount: number; payment_method: string }[];
}

export interface CashRegisterClosureFormData {
  counted_cash: number;
  notes?: string;
}

export interface PendingClosureSummary {
  sell_count: number;
  total_amount: number;
  total_efectivo: number;
  total_qr_transferencia: number;
  period_start: string | null;
}
