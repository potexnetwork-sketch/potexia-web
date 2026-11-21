"use client";

import { createClient } from "@/lib/supabase/client";
import type { FinanceTransaction, Invoice, InvoiceItem } from "@/types/database";
import { ArrowDownLeft, ArrowUpRight, FileText, Plus, Printer, Trash2, WalletCards } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const emptyInvoiceItem = { description: "", quantity: 1, unit_price: 0 };

function toRupiah(value: number) {
  const roundedValue = Math.round(value);
  const sign = roundedValue < 0 ? "-" : "";
  const groupedValue = Math.abs(roundedValue)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${sign}Rp${groupedValue}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export default function FinanceWorkspace({ compact = false }: { compact?: boolean }) {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<"overview" | "invoices">("overview");
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [transactionForm, setTransactionForm] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    category: "",
    description: "",
    transaction_date: new Date().toISOString().slice(0, 10),
  });

  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: "",
    customer_address: "",
    customer_phone: "",
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    tax_rate: "0",
    bank_name: "",
    account_number: "",
    account_holder: "",
  });
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([emptyInvoiceItem]);

  async function loadData() {
    const [transactionResult, invoiceResult] = await Promise.all([
      supabase
        .from("finance_transactions")
        .select("*")
        .order("transaction_date", { ascending: false }),
      supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .order("created_at", { ascending: false }),
    ]);

    if (transactionResult.error) setError(transactionResult.error.message);
    else setTransactions((transactionResult.data ?? []) as FinanceTransaction[]);

    if (invoiceResult.error) setError(invoiceResult.error.message);
    else setInvoices((invoiceResult.data ?? []) as Invoice[]);
  }

  useEffect(() => {
    void loadData();
  }, []);

  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const expense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);
  const balance = income - expense;
  const monthlyCashflow = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthTransactions = transactions.filter((transaction) => transaction.transaction_date.startsWith(monthKey));

    return {
      label: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date),
      income: monthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((total, transaction) => total + Number(transaction.amount), 0),
      expense: monthTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((total, transaction) => total + Number(transaction.amount), 0),
    };
  });
  const chartMax = Math.max(1, ...monthlyCashflow.flatMap((month) => [month.income, month.expense]));
  const chartPoints = monthlyCashflow.map((month, index) => ({
    ...month,
    x: 82 + index * 118,
    incomeY: 176 - (month.income / chartMax) * 150,
    expenseY: 176 - (month.expense / chartMax) * 150,
  }));
  const incomeLine = chartPoints.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.incomeY}`).join(" ");
  const expenseLine = chartPoints.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.expenseY}`).join(" ");
  const incomeArea = `${incomeLine} L${chartPoints.at(-1)?.x ?? 672} 176 L${chartPoints[0]?.x ?? 82} 176 Z`;
  const expenseArea = `${expenseLine} L${chartPoints.at(-1)?.x ?? 672} 176 L${chartPoints[0]?.x ?? 82} 176 Z`;
  const invoiceStatusBreakdown = [
    { label: "Lunas", count: invoices.filter((invoice) => invoice.status === "paid").length, color: "#24a982" },
    { label: "Terkirim", count: invoices.filter((invoice) => invoice.status === "sent").length, color: "#4f78f6" },
    { label: "Draf", count: invoices.filter((invoice) => invoice.status === "draft").length, color: "#ed9417" },
    { label: "Dibatalkan", count: invoices.filter((invoice) => invoice.status === "canceled").length, color: "#cbd5e1" },
  ];
  const invoiceCount = invoiceStatusBreakdown.reduce((total, item) => total + item.count, 0);
  let invoiceGradientOffset = 0;
  const invoiceStatusGradient = invoiceCount
    ? invoiceStatusBreakdown.map((item) => {
        const start = invoiceGradientOffset;
        invoiceGradientOffset += (item.count / invoiceCount) * 100;
        return `${item.color} ${start}% ${invoiceGradientOffset}%`;
      }).join(", ")
    : "#e2e8f0 0% 100%";

  function formatChartValue(value: number) {
    if (value >= 1_000_000) return `Rp${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
    if (value >= 1_000) return `Rp${Math.round(value / 1_000).toLocaleString("id-ID")} rb`;
    return toRupiah(value);
  }

  async function saveTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const amount = Number(transactionForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Nominal transaksi harus lebih dari 0.");
      setBusy(false);
      return;
    }

    const { error: insertError } = await supabase.from("finance_transactions").insert({
      type: transactionForm.type,
      amount,
      category: transactionForm.category,
      description: transactionForm.description,
      transaction_date: transactionForm.transaction_date,
      reference_type: "manual",
      reference_id: null,
    });

    if (insertError) setError(insertError.message);
    else {
      setMessage("Transaksi berhasil disimpan.");
      setTransactionForm({
        type: "expense",
        amount: "",
        category: "",
        description: "",
        transaction_date: new Date().toISOString().slice(0, 10),
      });
      await loadData();
    }
    setBusy(false);
  }

  async function deleteTransaction(transaction: FinanceTransaction) {
    if (!window.confirm("Hapus transaksi ini?")) return;
    setBusy(true);
    const { error: deleteError } = await supabase
      .from("finance_transactions")
      .delete()
      .eq("id", transaction.id);
    if (deleteError) setError(deleteError.message);
    else {
      setMessage("Transaksi berhasil dihapus.");
      await loadData();
    }
    setBusy(false);
  }

  const subtotal = invoiceItems.reduce(
    (total, item) => total + Number(item.quantity || 0) * Number(item.unit_price || 0),
    0
  );
  const taxRate = Number(invoiceForm.tax_rate || 0);
  const taxAmount = subtotal * (taxRate / 100);
  const invoiceTotal = subtotal + taxAmount;

  async function createInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const cleanItems = invoiceItems.filter((item) => item.description.trim() && Number(item.quantity) > 0);
    if (!cleanItems.length) {
      setError("Minimal satu item invoice harus diisi.");
      setBusy(false);
      return;
    }

    const { count } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true });
    const sequence = String((count ?? 0) + 1).padStart(3, "0");
    const invoiceNumber = `INV-${new Date().getFullYear()}-${sequence}`;

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        customer_name: invoiceForm.customer_name,
        customer_address: invoiceForm.customer_address,
        customer_phone: invoiceForm.customer_phone,
        issue_date: invoiceForm.issue_date,
        due_date: invoiceForm.due_date || null,
        status: "draft",
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total: invoiceTotal,
        notes: [
          invoiceForm.bank_name.trim() ? `Transfer melalui ${invoiceForm.bank_name.trim()}` : "",
          invoiceForm.account_number.trim() ? `Nomor rekening: ${invoiceForm.account_number.trim()}` : "",
          invoiceForm.account_holder.trim() ? `Atas nama: ${invoiceForm.account_holder.trim()}` : "",
        ].filter(Boolean).join("\n"),
        paid_at: null,
      })
      .select("*")
      .single();

    if (invoiceError || !invoice) {
      setError(invoiceError?.message ?? "Invoice gagal dibuat.");
      setBusy(false);
      return;
    }

    const itemRows = cleanItems.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    }));
    const { error: itemsError } = await supabase.from("invoice_items").insert(itemRows);

    if (itemsError) setError(itemsError.message);
    else {
      setMessage(`Invoice ${invoiceNumber} berhasil dibuat.`);
      setInvoiceForm({
        customer_name: "",
        customer_address: "",
        customer_phone: "",
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: "",
        tax_rate: "0",
        bank_name: "",
        account_number: "",
        account_holder: "",
      });
      setInvoiceItems([emptyInvoiceItem]);
      await loadData();
    }
    setBusy(false);
  }

  async function updateInvoiceStatus(invoice: Invoice, status: Invoice["status"]) {
    setBusy(true);
    setError("");

    const paidAt = status === "paid" ? new Date().toISOString() : null;
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status, paid_at: paidAt })
      .eq("id", invoice.id);

    if (updateError) {
      setError(updateError.message);
      setBusy(false);
      return;
    }

    if (status === "paid") {
      const { data: existing } = await supabase
        .from("finance_transactions")
        .select("id")
        .eq("reference_type", "invoice")
        .eq("reference_id", invoice.id)
        .limit(1);

      if (!existing?.length) {
        await supabase.from("finance_transactions").insert({
          type: "income",
          amount: Number(invoice.total),
          category: "Pembayaran invoice",
          description: `${invoice.invoice_number} - ${invoice.customer_name}`,
          transaction_date: new Date().toISOString().slice(0, 10),
          reference_type: "invoice",
          reference_id: invoice.id,
        });
      }
      setMessage(`${invoice.invoice_number} ditandai lunas dan masuk ke pemasukan.`);
    } else {
      await supabase
        .from("finance_transactions")
        .delete()
        .eq("reference_type", "invoice")
        .eq("reference_id", invoice.id);
      setMessage(`Status ${invoice.invoice_number} diperbarui.`);
    }

    await loadData();
    setBusy(false);
  }

  async function deleteInvoice(invoice: Invoice) {
    if (!window.confirm(`Hapus invoice ${invoice.invoice_number}?`)) return;
    setBusy(true);
    await supabase.from("finance_transactions").delete().eq("reference_id", invoice.id);
    const { error: deleteError } = await supabase.from("invoices").delete().eq("id", invoice.id);
    if (deleteError) setError(deleteError.message);
    else {
      setMessage("Invoice berhasil dihapus.");
      await loadData();
    }
    setBusy(false);
  }

  function printInvoicePdf(invoice: Invoice) {
    const items = invoice.invoice_items ?? [];
    const issueDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(invoice.issue_date));
    const itemsHtml = items.map((item) => `
      <tr>
        <td>${escapeHtml(item.description)}</td>
        <td>${item.quantity}</td>
        <td>${toRupiah(Number(item.unit_price))}</td>
        <td>${toRupiah(Number(item.quantity) * Number(item.unit_price))}</td>
      </tr>
    `).join("");

    const paymentHtml = invoice.notes
      ? `<div class="payment"><strong>Payment Instructions</strong><p>${escapeHtml(invoice.notes).replace(/\n/g, "<br>")}</p></div>`
      : "";

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setError("Popup diblokir. Izinkan popup untuk membuka dialog print invoice.");
      return;
    }
    printWindow.opener = null;

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${escapeHtml(invoice.invoice_number)}</title>
          <style>
            *{box-sizing:border-box}body{margin:0;background:#fff;color:#1e293b;font-family:Arial,sans-serif}.page{width:210mm;min-height:297mm;margin:0 auto;padding:18mm 18mm}header{display:flex;justify-content:space-between}.invoice-title{text-align:right}.invoice-title h1{margin:0;color:#1f3758;font-size:34px}.invoice-title p{margin:6px 0;color:#64748b}.meta{display:flex;margin-top:38px}.meta div{width:50%}.meta h3{margin:0 0 8px;color:#64748b;font-size:12px}.meta p{margin:2px 0;font-size:14px}table{width:100%;border-collapse:collapse;margin-top:32px}thead{background:#eef2f7}th,td{padding:14px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:14px}th{text-transform:uppercase}th:nth-child(2),td:nth-child(2),th:nth-child(3),td:nth-child(3),th:nth-child(4),td:nth-child(4){text-align:right}.totals{width:260px;margin:24px 0 0 auto}.total-row{display:flex;justify-content:flex-end;gap:32px;padding:5px 0;font-size:14px}.total-row strong:last-child{min-width:120px;text-align:right}.payment{margin-top:56px}.payment strong{display:block;margin-bottom:8px}.payment p{margin:0;color:#64748b;font-size:13px;line-height:1.6}@page{size:A4;margin:0}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}.page{width:210mm;height:297mm;padding:18mm}}
          </style>
        </head>
        <body>
          <div class="page">
            <header>
              <div></div>
              <div class="invoice-title"><h1>INVOICE</h1><p>${escapeHtml(invoice.invoice_number)}</p><p>Issued ${issueDate}</p></div>
            </header>
            <div class="meta">
              <div><h3>FROM</h3><p><strong>POTEXIA</strong></p></div>
              <div><h3>BILL TO</h3><p><strong>${escapeHtml(invoice.customer_name)}</strong></p><p>${escapeHtml(invoice.customer_phone)}</p><p>${escapeHtml(invoice.customer_address)}</p></div>
            </div>
            <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>${itemsHtml}</tbody></table>
            <div class="totals"><div class="total-row"><strong>Subtotal:</strong><strong>${toRupiah(Number(invoice.subtotal))}</strong></div><div class="total-row"><strong>Tax:</strong><strong>${toRupiah(Number(invoice.tax_amount))}</strong></div><div class="total-row"><strong>Total:</strong><strong>${toRupiah(Number(invoice.total))}</strong></div></div>
            ${paymentHtml}
          </div>
          <script>window.onload=function(){window.focus();window.print();}</script>
        </body>
      </html>`);
    printWindow.document.close();
    setMessage(`Dialog print invoice ${invoice.invoice_number} dibuka. Pilih PDF pada destination.`);
  }

  return (
    <div>
      {!compact && <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200">
          {[["overview", "Ringkasan"], ["invoices", "Invoice"]].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value as "overview" | "invoices")}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === value ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500"}`}
          >
            {label}
          </button>
        ))}
      </div>}

      {message && <p className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
      {error && <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {tab === "overview" && (
        <div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-lg bg-[#4f78f6] p-5 text-white shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white/85">Saldo Bersih</p><WalletCards size={19} className="text-white/80" /></div><p className="mt-4 text-2xl font-bold tracking-normal">{toRupiah(balance)}</p><p className="mt-1 text-xs text-white/75">Pemasukan dikurangi pengeluaran</p></article>
            <article className="rounded-lg bg-[#24a982] p-5 text-white shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white/85">Pemasukan</p><ArrowDownLeft size={19} className="text-white/80" /></div><p className="mt-4 text-2xl font-bold tracking-normal">{toRupiah(income)}</p><p className="mt-1 text-xs text-white/75">Dari invoice yang sudah lunas</p></article>
            <article className="rounded-lg bg-[#ed9417] p-5 text-white shadow-sm sm:col-span-2 xl:col-span-1"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white/85">Pengeluaran</p><ArrowUpRight size={19} className="text-white/80" /></div><p className="mt-4 text-2xl font-bold tracking-normal">{toRupiah(expense)}</p><p className="mt-1 text-xs text-white/75">Total transaksi pengeluaran</p></article>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.8fr)]">
            <article className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="font-bold text-slate-950">Arus Kas</h2><p className="mt-1 text-xs text-slate-500">Pemasukan dan pengeluaran selama 6 bulan terakhir</p></div>
                <div className="flex gap-4 text-xs font-medium"><span className="inline-flex items-center gap-2 text-slate-600"><i className="h-2.5 w-2.5 rounded-sm bg-blue-700" />Pemasukan</span><span className="inline-flex items-center gap-2 text-slate-600"><i className="h-2.5 w-2.5 rounded-sm bg-rose-400" />Pengeluaran</span></div>
              </div>
              <div className="mt-5 overflow-x-auto">
                <svg viewBox="0 0 720 250" role="img" aria-label="Grafik pemasukan dan pengeluaran enam bulan terakhir" className="h-auto w-full min-w-[520px]">
                  <defs><linearGradient id="income-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f78f6" stopOpacity="0.24" /><stop offset="100%" stopColor="#4f78f6" stopOpacity="0.015" /></linearGradient><linearGradient id="expense-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fb7185" stopOpacity="0.19" /><stop offset="100%" stopColor="#fb7185" stopOpacity="0.01" /></linearGradient></defs>
                  {[0, 1, 2, 3].map((line) => {
                    const y = 20 + line * 52;
                    const value = chartMax * (1 - line / 3);
                    return <g key={line}><line x1="62" y1={y} x2="704" y2={y} stroke="#e8edf4" strokeDasharray={line === 3 ? "0" : "4 5"} /><text x="54" y={y + 4} textAnchor="end" fill="#94a3b8" fontSize="10">{formatChartValue(value)}</text></g>;
                  })}
                  <path d={incomeArea} fill="url(#income-fill)" />
                  <path d={expenseArea} fill="url(#expense-fill)" />
                  <path d={incomeLine} fill="none" stroke="#3568eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={expenseLine} fill="none" stroke="#f26b83" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {chartPoints.map((point, index) => <g key={`${point.label}-${index}`}><circle cx={point.x} cy={point.incomeY} r="4" fill="#3568eb" stroke="white" strokeWidth="2"><title>{`Pemasukan ${point.label}: ${toRupiah(point.income)}`}</title></circle><circle cx={point.x} cy={point.expenseY} r="4" fill="#f26b83" stroke="white" strokeWidth="2"><title>{`Pengeluaran ${point.label}: ${toRupiah(point.expense)}`}</title></circle><text x={point.x} y="204" textAnchor="middle" fill="#64748b" fontSize="11">{point.label}</text></g>)}
                </svg>
              </div>
              {!transactions.length && <p className="-mt-1 text-center text-xs text-slate-400">Grafik akan terisi setelah ada invoice lunas atau transaksi pengeluaran.</p>}
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between"><div><h2 className="font-bold text-slate-950">Status Invoice</h2><p className="mt-1 text-xs text-slate-500">Ringkasan penagihan</p></div><FileText size={18} className="text-slate-400" /></div>
              <div className="mt-5 flex items-center gap-5"><div className="relative h-28 w-28 shrink-0 rounded-full" style={{ backgroundImage: `conic-gradient(${invoiceStatusGradient})` }}><div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-white"><strong className="text-xl text-slate-950">{invoiceCount}</strong><span className="text-[10px] text-slate-500">Invoice</span></div></div><div className="min-w-0 flex-1 space-y-2">{invoiceStatusBreakdown.map((item) => <div key={item.label} className="flex items-center justify-between gap-2 text-xs"><span className="inline-flex items-center gap-2 text-slate-600"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span><strong className="tabular-nums text-slate-800">{item.count}</strong></div>)}</div></div>
              <div className="mt-4 rounded-md bg-slate-50 p-3"><p className="text-xs text-slate-500">Belum tertagih</p><p className="mt-1 font-bold text-slate-950">{toRupiah(invoices.filter((invoice) => invoice.status === "sent").reduce((total, invoice) => total + Number(invoice.total), 0))}</p></div>
            </article>
          </div>

          <article className="mt-5 rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-950">Transaksi Terbaru</h2><p className="mt-1 text-xs text-slate-500">Aktivitas keuangan terbaru</p></div><span className="text-xs font-medium text-slate-400">{transactions.length} transaksi</span></div>
            {transactions.length ? <div className="mt-4 divide-y divide-slate-100">{transactions.slice(0, 5).map((transaction) => <div key={transaction.id} className="flex items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${transaction.type === "income" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{transaction.type === "income" ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{transaction.category}</p><p className="mt-0.5 truncate text-xs text-slate-500">{transaction.description || "-"} · {transaction.transaction_date}</p></div></div><p className={`shrink-0 text-sm font-bold tabular-nums ${transaction.type === "income" ? "text-emerald-700" : "text-rose-700"}`}>{transaction.type === "income" ? "+" : "-"}{toRupiah(Number(transaction.amount))}</p></div>)}</div> : <div className="mt-4 rounded-md border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">Belum ada transaksi keuangan.</div>}
          </article>

          <details className="mt-5 rounded-lg border border-slate-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold text-slate-800"><Plus size={17} />Catat Pengeluaran</summary>
            <form onSubmit={saveTransaction} className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm font-semibold text-slate-700">Nominal<input required type="number" min="1" value={transactionForm.amount} onChange={(event) => setTransactionForm({ ...transactionForm, amount: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
              <label className="text-sm font-semibold text-slate-700">Kategori<input required value={transactionForm.category} onChange={(event) => setTransactionForm({ ...transactionForm, category: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
              <label className="text-sm font-semibold text-slate-700">Tanggal<input required type="date" value={transactionForm.transaction_date} onChange={(event) => setTransactionForm({ ...transactionForm, transaction_date: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
              <label className="text-sm font-semibold text-slate-700 sm:col-span-2 xl:col-span-3">Keterangan<input value={transactionForm.description} onChange={(event) => setTransactionForm({ ...transactionForm, description: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
              <button disabled={busy} className="inline-flex items-center justify-center gap-2 self-end rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Plus size={16} />Simpan Pengeluaran</button>
            </form>
          </details>
        </div>
      )}

      {tab === "invoices" && (
        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <form onSubmit={createInvoice} className="h-fit rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">Buat Invoice</h2>
            <label className="mt-5 block text-sm font-semibold">Nama Customer<input required value={invoiceForm.customer_name} onChange={(event) => setInvoiceForm({ ...invoiceForm, customer_name: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
            <label className="mt-4 block text-sm font-semibold">Nomor Telepon<input value={invoiceForm.customer_phone} onChange={(event) => setInvoiceForm({ ...invoiceForm, customer_phone: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
            <label className="mt-4 block text-sm font-semibold">Alamat<textarea rows={2} value={invoiceForm.customer_address} onChange={(event) => setInvoiceForm({ ...invoiceForm, customer_address: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
            <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-sm font-semibold">Tanggal<input type="date" value={invoiceForm.issue_date} onChange={(event) => setInvoiceForm({ ...invoiceForm, issue_date: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label><label className="text-sm font-semibold">Jatuh Tempo<input type="date" value={invoiceForm.due_date} onChange={(event) => setInvoiceForm({ ...invoiceForm, due_date: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label></div>
            <div className="mt-5 space-y-3"><div className="flex items-center justify-between"><p className="text-sm font-bold">Item Invoice</p><button type="button" onClick={() => setInvoiceItems([...invoiceItems, { ...emptyInvoiceItem }])} className="inline-flex items-center gap-1 text-xs font-bold text-blue-900"><Plus size={14} />Tambah item</button></div>{invoiceItems.map((item, index) => <div key={index} className="grid grid-cols-[1fr_60px_100px] gap-2"><input required aria-label="Deskripsi" placeholder="Deskripsi" value={item.description} onChange={(event) => setInvoiceItems(invoiceItems.map((row, rowIndex) => rowIndex === index ? { ...row, description: event.target.value } : row))} className="rounded-md border border-slate-300 px-2 py-2 text-sm" /><input required min="1" type="number" aria-label="Qty" value={item.quantity} onChange={(event) => setInvoiceItems(invoiceItems.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: Number(event.target.value) } : row))} className="rounded-md border border-slate-300 px-2 py-2 text-sm" /><input required min="0" type="number" aria-label="Harga" value={item.unit_price} onChange={(event) => setInvoiceItems(invoiceItems.map((row, rowIndex) => rowIndex === index ? { ...row, unit_price: Number(event.target.value) } : row))} className="rounded-md border border-slate-300 px-2 py-2 text-sm" /></div>)}</div>
            <label className="mt-4 block text-sm font-semibold">Pajak (%)<input type="number" min="0" value={invoiceForm.tax_rate} onChange={(event) => setInvoiceForm({ ...invoiceForm, tax_rate: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5" /></label>
            <div className="mt-4"><p className="text-sm font-semibold text-slate-700">Instruksi Pembayaran</p><div className="mt-2 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Nama Bank<input value={invoiceForm.bank_name} onChange={(event) => setInvoiceForm({ ...invoiceForm, bank_name: event.target.value })} placeholder="" className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /></label><label className="text-xs font-semibold text-slate-600">Nomor Rekening<input value={invoiceForm.account_number} onChange={(event) => setInvoiceForm({ ...invoiceForm, account_number: event.target.value })} placeholder="" className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /></label><label className="text-xs font-semibold text-slate-600 sm:col-span-2">Nama Pemegang Rekening<input value={invoiceForm.account_holder} onChange={(event) => setInvoiceForm({ ...invoiceForm, account_holder: event.target.value })} placeholder="" className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /></label></div></div>
            <div className="mt-5 space-y-1 border-t border-slate-200 pt-4 text-sm"><p className="flex justify-between"><span>Subtotal</span><strong>{toRupiah(subtotal)}</strong></p><p className="flex justify-between"><span>Pajak</span><strong>{toRupiah(taxAmount)}</strong></p><p className="flex justify-between text-base"><span>Total</span><strong>{toRupiah(invoiceTotal)}</strong></p></div>
            <button disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"><FileText size={16} />Buat Invoice</button>
          </form>

          <div className="space-y-3">{invoices.map((invoice) => <article key={invoice.id} className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{invoice.invoice_number}</h2><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold uppercase">{invoice.status}</span></div><p className="mt-2 font-semibold text-slate-700">{invoice.customer_name}</p><p className="mt-1 text-sm text-slate-500">{invoice.issue_date} • {toRupiah(Number(invoice.total))}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => printInvoicePdf(invoice)} className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50" aria-label={`Cetak invoice ${invoice.invoice_number}`} title="Cetak invoice"><Printer size={16} /></button><select disabled={busy} value={invoice.status} onChange={(event) => updateInvoiceStatus(invoice, event.target.value as Invoice["status"])} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-bold"><option value="draft">Draft</option><option value="sent">Terkirim</option><option value="paid">Lunas</option><option value="canceled">Dibatalkan</option></select><button disabled={busy} type="button" onClick={() => deleteInvoice(invoice)} className="rounded-md border border-red-200 p-2 text-red-700"><Trash2 size={14} /></button></div></div></article>)}</div>
        </div>
      )}
    </div>
  );
}
