"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  MoreHorizontal,
  Search,
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
import { Textarea } from "@/components/ui/textarea";
import { type Booking, useBookingsStore } from "@/stores/bookings-store";

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
    confirmed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    cancelled: { color: "bg-red-100 text-red-800", icon: XCircle },
    completed: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
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

function BookingDetailsDialog({ booking }: { booking: Booking }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>
            Booking ID: {booking.id.slice(0, 8).toUpperCase()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Customer</Label>
              <p className="text-sm">{booking.user_name}</p>
              <p className="text-sm text-muted-foreground">
                {booking.user_email}
              </p>
              <p className="text-sm text-muted-foreground">
                {booking.user_phone}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Package & Amount</Label>
              <p className="text-sm">{booking.package_id} Package</p>
              <p className="text-lg font-bold">€{booking.total_amount}</p>
              <StatusBadge status={booking.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Session Date & Time</Label>
              <p className="text-sm">{booking.booking_date}</p>
              <p className="text-sm">{booking.booking_time}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Booking Created</Label>
              <p className="text-sm">
                {new Date(booking.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(booking.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {booking.notes && (
            <div>
              <Label className="text-sm font-medium">Notes</Label>
              <p className="text-sm bg-muted p-3 rounded-md">{booking.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 p-3 bg-muted/20 rounded-lg border">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase">
                Total
              </Label>
              <p className="text-lg font-bold">€{booking.total_amount}</p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase">
                Paid (Deposit)
              </Label>
              <p className="text-lg font-bold text-success">
                €
                {booking.payments
                  ?.filter((p) => p.status === "success")
                  .reduce((sum, p) => sum + p.amount, 0) || 0}
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase">
                Remaining
              </Label>
              <p className="text-lg font-bold text-destructive">
                €
                {booking.total_amount -
                  (booking.payments
                    ?.filter((p) => p.status === "success")
                    .reduce((sum, p) => sum + p.amount, 0) || 0)}
              </p>
            </div>
          </div>

          {booking.payments && booking.payments.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Payments</Label>
              <div className="space-y-2">
                {booking.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-2 bg-muted rounded-md"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        €{payment.amount} - {payment.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.payment_id} •{" "}
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        payment.status === "success" ? "default" : "destructive"
                      }
                    >
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditBookingDialog({
  booking,
  onUpdate,
}: {
  booking: Booking;
  onUpdate: (
    id: string,
    updates: { status: string; notes?: string },
  ) => Promise<void>;
}) {
  const [status, setStatus] = useState(booking.status);
  const [notes, setNotes] = useState(booking.notes || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [open, setOpen] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(booking.id, { status, notes });
      setOpen(false);
      toast.success("Booking updated successfully");
    } catch (_error) {
      toast.error("Failed to update booking");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Booking
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
          <DialogDescription>
            Update booking status and notes for {booking.user_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value: string) =>
                setStatus(value as typeof status)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes..."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BookingsPage() {
  const {
    bookings,
    pagination,
    loading,
    error,
    filters,
    fetchBookings,
    updateBooking,
    setFilters,
    setPage,
    clearError,
  } = useBookingsStore();

  const { search, statusFilter, sortBy, sortOrder } = filters;

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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

  const formatCurrency = (amount: number) => `€${amount.toLocaleString()}`;

  // Wrapper for updateBooking that shows success toast
  const handleUpdateBooking = async (
    id: string,
    updates: { status: string; notes?: string },
  ) => {
    try {
      await updateBooking(id, updates);
      toast.success("Booking updated successfully");
    } catch (_error) {
      // Error toast is already shown by the effect above
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">
            Manage customer bookings and reservations
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
                  placeholder="Search bookings..."
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
              onValueChange={(value) => setFilters({ statusFilter: value })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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
                <SelectItem value="booking_date-desc">
                  Session Date (Latest)
                </SelectItem>
                <SelectItem value="booking_date-asc">
                  Session Date (Earliest)
                </SelectItem>
                <SelectItem value="total_amount-desc">
                  Amount (High to Low)
                </SelectItem>
                <SelectItem value="total_amount-asc">
                  Amount (Low to High)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Spinner className="size-8 mx-auto" />
              <p className="mt-2 text-muted-foreground">Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-8">
              <Empty>
                <EmptyMedia variant="icon">
                  <Calendar className="size-12" />
                </EmptyMedia>
                <EmptyTitle>No bookings found</EmptyTitle>
                <EmptyDescription>
                  Bookings will appear here when customers make reservations
                </EmptyDescription>
              </Empty>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Session Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.user_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.user_email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.package_id}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{booking.booking_date}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.booking_time}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(booking.total_amount)}
                    </TableCell>
                    <TableCell className="text-success">
                      {formatCurrency(
                        booking.payments
                          ?.filter((p) => p.status === "success")
                          .reduce((sum, p) => sum + p.amount, 0) || 0
                      )}
                    </TableCell>
                    <TableCell className="text-destructive font-medium">
                      {formatCurrency(
                        booking.total_amount -
                        (booking.payments
                          ?.filter((p) => p.status === "success")
                          .reduce((sum, p) => sum + p.amount, 0) || 0)
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString()}
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
                          <BookingDetailsDialog booking={booking} />
                          <EditBookingDialog
                            booking={booking}
                            onUpdate={handleUpdateBooking}
                          />
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
            {pagination.total} bookings
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
