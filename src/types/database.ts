export type ServiceCategory =
  | "Kantor"
  | "Hotel & Villa"
  | "F&B & UMKM"
  | "Sekolah";

export type ServiceType =
  | "Jaringan"
  | "Managed Service IT"
  | "Aplikasi POS";

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  service_type: string;
  summary: string;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
}

export interface ConsultationRequest {
  id: string;
  name: string;
  business: string;
  segment: string;
  service: string;
  location: string;
  notes: string;
  locale: "id" | "en";
  status: "new" | "processed" | "completed";
  created_at: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_address: string;
  customer_phone: string;
  issue_date: string;
  due_date: string | null;
  status: "draft" | "sent" | "paid" | "canceled";
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string;
  paid_at: string | null;
  created_at: string;
  invoice_items?: InvoiceItem[];
}

export interface FinanceTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  transaction_date: string;
  reference_type: "manual" | "invoice";
  reference_id: string | null;
  created_at: string;
}

export interface CompanySettings {
  id: number;
  brand_name: string;
  tagline: string;
  email: string;
  whatsapp_number: string;
  phone_display: string;
  address: string;
  updated_at?: string;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: 1,
  brand_name: "POTEXIA",
  tagline: "TECHNOLOGY & BUSINESS SOLUTIONS",
  email: "ezwanali@gmail.com",
  whatsapp_number: "6287782680897",
  phone_display: "0877-8268-0897",
  address:
    "Dasan Lekong, Desa Bujak, Kecamatan Batukliang, Kabupaten Lombok Tengah, Provinsi NTB",
};
