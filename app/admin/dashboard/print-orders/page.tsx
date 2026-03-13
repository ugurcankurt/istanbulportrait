"use client";

import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  Package,
  Search,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
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
import { type PrintOrder, usePrintOrdersStore } from "@/stores/print-orders-store";

function StatusBadge({ status, type }: { status: string; type: "payment" | "prodigi" }) {
  if (type === "payment") {
    const config = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      success: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle },
    };
    const { color, icon: Icon } = config[status as keyof typeof config] || config.pending;
    return (
      <Badge variant="secondary" className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }

  // Prodigi Status
  const getProdigiStyle = (s: string) => {
    switch (s.toLowerCase()) {
      case "shipped": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-purple-100 text-purple-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      case "draft": return "bg-orange-100 text-orange-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Badge variant="outline" className={getProdigiStyle(status)}>
      {status === "shipped" && <Truck className="w-3 h-3 mr-1" />}
      {status === "in_progress" && <Package className="w-3 h-3 mr-1" />}
      {status.replace(/_/g, " ").charAt(0).toUpperCase() + status.replace(/_/g, " ").slice(1)}
    </Badge>
  );
}

function OrderDetailsDialog({ order }: { order: PrintOrder }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Internal ID: {order.id}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Customer Information</Label>
              <div className="mt-2 space-y-1">
                <p className="font-semibold">{order.customer_name}</p>
                <p className="text-sm">{order.customer_email}</p>
                {order.customer_phone && <p className="text-sm">{order.customer_phone}</p>}
                <Badge variant="secondary" className="mt-1">Locale: {order.locale.toUpperCase()}</Badge>
              </div>
            </div>

            <div>
              <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Shipping Address</Label>
              <div className="mt-2 text-sm space-y-1 bg-muted/30 p-3 rounded-lg border">
                <p>{order.shipping_line1}</p>
                {order.shipping_line2 && <p>{order.shipping_line2}</p>}
                <p>{order.shipping_town_city}, {order.shipping_state_county || ""}</p>
                <p>{order.shipping_postal_code}</p>
                <p className="font-bold">{order.shipping_country_code}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Payment Breakdown</Label>
              <div className="mt-2 space-y-2 bg-muted/30 p-4 rounded-lg border">
                <div className="flex justify-between text-sm">
                  <span>Items Subtotal:</span>
                  <span>€{order.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>€{order.shipping_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxes:</span>
                  <span>€{order.tax_amount.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                  <span>Total Paid:</span>
                  <div className="flex flex-col items-end">
                    <span>€{order.order_total_amount.toFixed(2)}</span>
                    <StatusBadge status={order.payment_status} type="payment" />
                  </div>
                </div>
              </div>
              {order.iyzico_payment_id && (
                <p className="text-xs text-muted-foreground mt-2 px-1">Provider ID: {order.iyzico_payment_id}</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Item Details</Label>
              <div className="mt-2 flex gap-4 bg-muted/30 p-4 rounded-lg border">
                <div className="w-20 h-20 bg-background rounded border overflow-hidden flex-shrink-0">
                  <img src={order.image_url} alt="Order item" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="font-medium truncate">{order.sku}</p>
                  <p className="text-sm text-muted-foreground">Quantity: {order.copies}</p>
                  <p className="text-sm font-semibold">€{order.total_amount}</p>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Prodigi Fulfillment</Label>
              <div className="mt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Prodigi ID:</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{order.prodigi_order_id || "N/A"}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <StatusBadge status={order.prodigi_status} type="prodigi" />
                </div>
                
                {order.prodigi_status === "shipped" && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-3">
                    <p className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center">
                      <Truck className="w-3 h-3 mr-1" /> Shipment Tracking
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">Carrier:</span>
                      <span className="font-medium text-blue-900">{order.shipping_carrier || "N/A"}</span>
                      
                      <span className="text-muted-foreground">Tracking #:</span>
                      <span className="font-mono text-blue-900">{order.tracking_number || "N/A"}</span>
                    </div>
                    {order.tracking_url && (
                      <Button variant="outline" size="sm" className="w-full mt-2 bg-white border-blue-200 text-blue-700 hover:bg-blue-50" asChild>
                        <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
                          Track Order
                        </a>
                      </Button>
                    )}
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2">
                  Last sync: {new Date(order.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditOrderDialog({
  order,
  onUpdate,
}: {
  order: PrintOrder;
  onUpdate: (id: string, updates: { paymentStatus: string }) => Promise<void>;
}) {
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [open, setOpen] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(order.id, { paymentStatus });
      setOpen(false);
      toast.success("Order updated successfully");
    } catch (_error) {
      toast.error("Failed to update order");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Edit className="w-4 h-4 mr-2" />
          Update Status
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Manually update the internal status for {order.customer_name}'s order.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="payment-status">Payment Status</Label>
            <Select
              value={paymentStatus}
              onValueChange={setPaymentStatus}
            >
              <SelectTrigger id="payment-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-md border border-blue-200">
            Note: Prodigi status is automatically managed by webhooks.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PrintOrdersPage() {
  const {
    orders,
    pagination,
    loading,
    error,
    filters,
    fetchOrders,
    updateOrder,
    setFilters,
    setPage,
    clearError,
  } = usePrintOrdersStore();

  const { search, statusFilter, sortBy, sortOrder } = filters;

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const handleUpdateOrder = async (id: string, updates: { paymentStatus: string }) => {
    await updateOrder(id, updates);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Print Orders</h1>
          <p className="text-muted-foreground">
            Manage physical print orders and fulfillment status
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

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
                  placeholder="Search by name, email, or order ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10"
                />
              </InputGroup>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setFilters({ statusFilter: value })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Prodigi Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prodigi Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="total_amount-desc">Amount (High to Low)</SelectItem>
                <SelectItem value="total_amount-asc">Amount (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <Spinner className="size-8 mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading print orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12">
              <Empty>
                <EmptyMedia variant="icon">
                  <ShoppingBag className="size-12" />
                </EmptyMedia>
                <EmptyTitle>No print orders found</EmptyTitle>
                <EmptyDescription>
                  When customers purchase prints from the shop, they will appear here.
                </EmptyDescription>
              </Empty>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Grand Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Prodigi Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="font-medium truncate">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground truncate">{order.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-muted rounded border overflow-hidden flex-shrink-0">
                            <img src={order.image_url} alt="SKU" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{order.sku}</p>
                            <p className="text-xs text-muted-foreground">Qty: {order.copies}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        €{order.order_total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.payment_status} type="payment" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={order.prodigi_status} type="prodigi" />
                        {order.prodigi_order_id && (
                          <p className="text-[10px] font-mono text-muted-foreground mt-1 truncate max-w-[100px]">
                            {order.prodigi_order_id}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(order.created_at).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <OrderDetailsDialog order={order} />
                            <DropdownMenuSeparator />
                            <EditOrderDialog order={order} onUpdate={handleUpdateOrder} />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} orders
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
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
