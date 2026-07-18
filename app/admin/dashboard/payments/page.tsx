"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Download,
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePaymentsStore } from "@/stores/payments-store";

const formatCurrency = (amount: number, currency: string = "EUR") => {
  if (typeof amount !== "number") return `0.00 ${currency}`;
  const rounded = Math.round(amount * 100) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(rounded);
};

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
    success: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    failure: { color: "bg-red-100 text-red-800", icon: XCircle },
  };

  const { color, icon: Icon } =
    config[status as keyof typeof config] || config.pending;

  return (
    <Badge variant="secondary" className={color}>
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function PaymentDetailsDialog({ payment }: { payment: any }) {
  const [open, setOpen] = useState(false);

  // Extract TRY amounts from provider_response if it's Iyzico
  let tryAmount = payment.currency === 'TRY' ? payment.amount : 0;
  let iyzicoFee = 0;
  
  if (payment.provider === 'iyzico' && payment.provider_response?.paidPrice) {
    tryAmount = payment.provider_response.paidPrice;
    
    // Calculate Iyzico commission (fixed fee + rate amount)
    const fixedFee = payment.provider_response.iyziCommissionFee || 0;
    const rateAmount = payment.provider_response.iyziCommissionRateAmount || 0;
    iyzicoFee = fixedFee + rateAmount;
  }

  const tryNet = tryAmount / 1.20;
  const tryVat = tryAmount - tryNet;
  const finalNetProfit = tryAmount - tryVat - iyzicoFee;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenuItem onClick={() => setOpen(true)} closeOnClick={false}>
        <Eye className="w-4 h-4 mr-2" />
        View Details
      </DropdownMenuItem>
      <DialogContent className="sm:max-w-2xl w-[95vw] p-0 overflow-hidden bg-background border-border/50">
        <div className="p-6 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-blue-500 text-lg font-medium tracking-tight">Payment Details</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm break-all">
              ID: {payment.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1 overflow-hidden">
                <p className="text-sm font-semibold text-foreground">Customer</p>
                <p className="text-sm text-foreground/90 truncate">{payment.bookings?.user_name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground truncate">{payment.bookings?.user_email || 'No email'}</p>
              </div>
              <div className="space-y-1 overflow-hidden">
                <p className="text-sm font-semibold text-foreground">Transaction</p>
                <p className="text-sm text-foreground/90 truncate">Provider: <span className="capitalize">{payment.provider}</span></p>
                <p className="text-sm text-muted-foreground truncate">Payment ID: {payment.payment_id}</p>
                <div className="pt-1.5">
                  <StatusBadge status={payment.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Date</p>
                <p className="text-sm text-foreground/90">{new Date(payment.created_at).toLocaleDateString('tr-TR').replace(/\./g, '.')}</p>
                <p className="text-sm text-muted-foreground">{new Date(payment.created_at).toLocaleTimeString('tr-TR')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Original Amount</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(payment.amount, payment.currency)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-5 overflow-hidden">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-3 mb-4">
                Turkish Lira (TRY) Breakdown
              </h4>
              
              {tryAmount > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase">Net Amount</p>
                      <p className="text-lg font-semibold text-foreground break-words">{formatCurrency(tryNet, 'TRY').replace('TRY', 'TRY ')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase">VAT / KDV (20%)</p>
                      <p className="text-lg font-semibold text-foreground break-words">{formatCurrency(tryVat, 'TRY').replace('TRY', 'TRY ')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase">Gross Total</p>
                      <p className="text-lg font-bold text-foreground break-words">{formatCurrency(tryAmount, 'TRY').replace('TRY', 'TRY ')}</p>
                    </div>
                  </div>

                  {payment.provider === 'iyzico' && (
                    <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 -mx-5 -mb-5 p-5">
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase">Iyzico Commission</p>
                        <p className="text-lg font-semibold text-destructive break-words">
                          - {formatCurrency(iyzicoFee, 'TRY').replace('TRY', 'TRY ')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase">VAT Deducted</p>
                        <p className="text-lg font-semibold text-destructive break-words">
                          - {formatCurrency(tryVat, 'TRY').replace('TRY', 'TRY ')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase">Final Net Profit</p>
                        <p className="text-xl font-bold text-green-500 break-words">{formatCurrency(finalNetProfit, 'TRY').replace('TRY', 'TRY ')}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">TRY amount could not be automatically determined from the provider response.</p>
              )}
            </div>

            {payment.provider_response && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Provider Metadata (Raw)</p>
                <div className="rounded-xl bg-secondary/50 p-4 overflow-auto max-h-48">
                  <pre className="text-xs text-muted-foreground font-mono leading-relaxed">
                    {JSON.stringify(payment.provider_response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PaymentsPage() {
  const {
    payments,
    pagination,
    loading,
    error,
    filters,
    fetchPayments,
    setFilters,
    setPage,
    clearError,
  } = usePaymentsStore();

  const { search, statusFilter, sortBy, sortOrder } = filters;

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== search) {
        setFilters({ search: searchInput });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, search, setFilters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Invoicing</h1>
          <p className="text-muted-foreground">
            Monitor incoming payments and KDV (VAT) details
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Search className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search by customer name or email..."
                  value={searchInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchInput(e.target.value)
                  }
                  className="pl-10"
                />
              </InputGroup>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setFilters({ statusFilter: value || "all" })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                if (!value) return;
                const [field, order] = value.split("-");
                setFilters({
                  sortBy: field,
                  sortOrder: order as "asc" | "desc",
                });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Spinner className="size-8 mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8">
              <Empty>
                <EmptyMedia variant="icon">
                  <CreditCard className="size-12" />
                </EmptyMedia>
                <EmptyTitle>No payments found</EmptyTitle>
                <EmptyDescription>
                  Payments will appear here when customers complete transactions.
                </EmptyDescription>
              </Empty>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Net Amount</TableHead>
                  <TableHead className="text-right">VAT (20%)</TableHead>
                  <TableHead className="text-right font-bold">Total Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  // Calculate VAT (KDV)
                  // Total = Net * 1.20 => Net = Total / 1.20
                  const total = payment.amount || 0;
                  const net = total / 1.20;
                  const vat = total - net;
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.bookings ? (
                          <div>
                            <p className="font-medium">
                              {payment.bookings.user_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payment.bookings.user_email}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            Unknown / Deleted
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.created_at).toLocaleTimeString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.provider}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="text-right font-medium text-muted-foreground">
                        {formatCurrency(net, payment.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-muted-foreground">
                        {formatCurrency(vat, payment.currency)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-success">
                        {formatCurrency(total, payment.currency)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
                            <MoreHorizontal className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <PaymentDetailsDialog payment={payment} />
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} payments
          </p>
          <div className="flex items-center space-x-2">
            <ButtonGroup>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </ButtonGroup>
            <span className="text-sm px-4 py-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
