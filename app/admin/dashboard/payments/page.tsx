"use client";

import {
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  MoreHorizontal,
  Search,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Payment, usePaymentsStore } from "@/stores/payments-store";

function PaymentStatusBadge({ status }: { status: string }) {
  const config = {
    success: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    failure: { color: "bg-red-100 text-red-800", icon: XCircle },
    pending: { color: "bg-yellow-100 text-yellow-800", icon: CreditCard },
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

function PaymentDetailsDialog({ payment }: { payment: Payment }) {
  const formatCurrency = (amount: number, currency = "EUR") =>
    `${currency === "EUR" ? "€" : "$"}${amount.toLocaleString()}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            Payment ID: {payment.payment_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  PAYMENT INFORMATION
                </Label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Amount:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Currency:</span>
                    <span className="text-sm font-medium">
                      {payment.currency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Status:</span>
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Provider:</span>
                    <span className="text-sm font-medium capitalize">
                      {payment.provider}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  TRANSACTION IDS
                </Label>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Payment ID:
                    </span>
                    <p className="text-sm font-mono break-all">
                      {payment.payment_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Conversation ID:
                    </span>
                    <p className="text-sm font-mono break-all">
                      {payment.conversation_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Booking ID:
                    </span>
                    <p className="text-sm font-mono break-all">
                      {payment.booking_id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Booking Info */}
          {payment.bookings && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                BOOKING INFORMATION
              </Label>
              <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">
                      {payment.bookings.user_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.bookings.user_email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <Badge variant="outline">
                        {payment.bookings.package_id}
                      </Badge>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.bookings.booking_date} at{" "}
                      {payment.bookings.booking_time}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              TIMESTAMPS
            </Label>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Created:</span>
                <span className="text-sm">
                  {new Date(payment.created_at).toLocaleString()}
                </span>
              </div>
              {payment.updated_at && (
                <div className="flex justify-between">
                  <span className="text-sm">Updated:</span>
                  <span className="text-sm">
                    {new Date(payment.updated_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Provider Response */}
          {payment.provider_response && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                PROVIDER RESPONSE
              </Label>
              <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                <pre className="text-xs overflow-auto max-h-40">
                  {JSON.stringify(payment.provider_response, null, 2)}
                </pre>
              </div>
            </div>
          )}
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
    stats,
    fetchPayments,
    setFilters,
    setPage,
    clearError,
  } = usePaymentsStore();

  const { search, statusFilter, dateFrom, dateTo, sortBy, sortOrder } = filters;

  // Fetch payments on component mount
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Show error as toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // Handle search input changes with debouncing
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== search) {
        setFilters({ search: searchInput });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, search, setFilters]);

  const formatCurrency = (amount: number, currency = "EUR") =>
    `${currency === "EUR" ? "€" : "$"}${amount.toLocaleString()}`;

  // Extract stats for easier access
  const { totalAmount, successfulPayments, failedPayments, successRate } =
    stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Monitor payment transactions and analytics
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Processed
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Successful transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {successfulPayments}/{payments.length} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Successful Payments
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {successfulPayments}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Failed Payments
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {failedPayments}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by payment ID or conversation ID..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setFilters({ statusFilter: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2 items-center">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setFilters({ dateFrom: e.target.value })}
                  className="w-40"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setFilters({ dateTo: e.target.value })}
                  className="w-40"
                />
              </div>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
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
                  <SelectItem value="amount-desc">
                    Amount (High to Low)
                  </SelectItem>
                  <SelectItem value="amount-asc">
                    Amount (Low to High)
                  </SelectItem>
                  <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm">
                          {payment.payment_id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.conversation_id.slice(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.bookings ? (
                        <div>
                          <p className="font-medium text-sm">
                            {payment.bookings.user_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.bookings.user_email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No booking info
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={payment.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payment.provider}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <PaymentDetailsDialog payment={payment} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm px-4 py-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
