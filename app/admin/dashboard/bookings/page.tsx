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
import { RiWhatsappFill } from "@remixicon/react";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import { Input } from "@/components/ui/input";
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
import { usePackagesStore } from "@/stores/packages-store";

const formatCurrency = (amount: number) => {
  if (typeof amount !== "number") return `€0.00`;
  const rounded = Math.round(amount * 100) / 100;
  return `€${rounded.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const generateWhatsAppLink = (booking: Booking) => {
  if (!booking.user_phone) return "#";
  const phone = booking.user_phone.replace(/[^0-9+]/g, '');

  const eWave = String.fromCodePoint(0x1F44B);
  const eCamera = String.fromCodePoint(0x1F4F8);
  const eCheck = String.fromCodePoint(0x2705);
  const eEuro = String.fromCodePoint(0x1F4B6);
  const ePeople = String.fromCodePoint(0x1F465);
  const eCash = String.fromCodePoint(0x1F4B5);
  const eSparkles = String.fromCodePoint(0x2728);
  const eDove = String.fromCodePoint(0x1F54A, 0xFE0F);
  const eSpeech = String.fromCodePoint(0x1F4AC);

  let text = "";
  if (booking.status === "confirmed") {
    let detailsStr = `Total Amount: ${formatCurrency(booking.total_amount)} 💶\n`;
    
    if (booking.people_count && booking.people_count > 0) {
      detailsStr += `Number of People: ${booking.people_count} 👥\n`;
    }
    
    let featuresText = "";
    const packages = usePackagesStore.getState().packages;
    const pkg = packages.find(p => p.slug === booking.package_id || p.id === booking.package_id);
    if (pkg?.features?.en?.length) {
      featuresText = `\nPackage Includes:\n${pkg.features.en.map((f: string) => `• ${f}`).join('\n')}\n`;
    }
    
    text = `Hello ${booking.user_name} 👋,\n\nThank you for your interest in Istanbul Portrait! 📸\n\nYour reservation for the ${booking.package_id} package on ${booking.booking_date} at ${booking.booking_time} is confirmed! ✅\n\n${detailsStr}${featuresText}\nPlease note that payments are cash-only on the day of the photoshoot. 💵\n\nWe look forward to welcoming you! ✨\n\nBest regards,\nIstanbul Portrait 🕊️`;
  } else if (booking.status === "pending") {
    text = `Hello ${booking.user_name} ${eWave},\n\nWe noticed your reservation at Istanbul Portrait isn't complete yet. Would you like to join us? ${eCamera}\n\nYou can reach out to us through this message to complete your reservation or if you need any assistance! ${eSpeech}\n\nBest regards,\nIstanbul Portrait ${eDove}`;
  } else if (booking.status === "completed") {
    const driveLink = booking.drive_folder_id ? `\n\nGoogle Drive Link:\nhttps://drive.google.com/drive/folders/${booking.drive_folder_id}` : "";
    
    let editedCountText = "Please select the photos you want us to edit from the link. ";
    const packages = usePackagesStore.getState().packages;
    const pkg = packages.find(p => p.slug === booking.package_id || p.id === booking.package_id);
    if (pkg?.features?.en) {
      const editedFeature = pkg.features.en.find((f: string) => /edit|retouch/i.test(f));
      if (editedFeature) {
        const match = editedFeature.match(/(\d+)/);
        if (match) {
          editedCountText = `Based on your package, you can select up to ${match[1]} photos for editing. `;
        }
      }
    }
    
    text = `Hello ${booking.user_name} ${eWave},\n\nThank you for a wonderful photoshoot! ${eCamera}${driveLink}\n\n${editedCountText}Please review the photos in the folder and reply to this message with the file numbers of your selections! ${eSparkles}\n\nBest regards,\nIstanbul Portrait ${eDove}`;
  } else {
     text = `Hello ${booking.user_name} ${eWave},\n\nWe are contacting you regarding your reservation at Istanbul Portrait. ${eCamera}`;
  }
  
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
};

const generateReviewLink = (booking: Booking) => {
  if (!booking.user_phone) return "#";
  const phone = booking.user_phone.replace(/[^0-9+]/g, '');

  const eWave = String.fromCodePoint(0x1F44B);
  const eCamera = String.fromCodePoint(0x1F4F8);
  const eSparkles = String.fromCodePoint(0x2728);
  const eDove = String.fromCodePoint(0x1F54A, 0xFE0F);
  const eStar = String.fromCodePoint(0x2B50);

  const text = `Hello ${booking.user_name} ${eWave},\n\nThank you for choosing Istanbul Portrait! ${eCamera} We hope you enjoyed your photoshoot experience with us.\n\nWe would love to hear your feedback! If you have a moment, please leave us a review on Google:\nhttps://g.page/r/CQbrbmj8_EInEBM/review ${eStar}\n\nYour support means the world to us! ${eSparkles}\n\nBest regards,\nIstanbul Portrait ${eDove}`;

  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
};

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
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenuItem onClick={() => setOpen(true)} closeOnClick={false}>
        <Eye className="w-4 h-4 mr-2" />
        View Details
      </DropdownMenuItem>
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
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-muted-foreground">
                  {booking.user_phone}
                </p>
                {booking.user_phone && (
                  <a
                    href={generateWhatsAppLink(booking)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#25D366] hover:text-[#128C7E] transition-colors"
                    title="WhatsApp'tan Mesaj Gönder"
                  >
                    <RiWhatsappFill className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Package & Amount</Label>
              <p className="text-sm inline-flex items-center gap-2">
                {booking.package_id} Package
                {booking.people_count && booking.people_count > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {booking.people_count}{" "}
                    {booking.people_count === 1 ? "Person" : "People"}
                  </Badge>
                )}
              </p>
              <p className="text-lg font-bold">
                {formatCurrency(booking.total_amount)}
              </p>
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

          {booking.drive_folder_id && (
            <div>
              <Label className="text-sm font-medium">Google Drive Folder</Label>
              <div className="bg-muted p-3 rounded-md flex items-center justify-between">
                <p className="text-sm font-mono truncate mr-4">
                  {booking.drive_folder_id}
                </p>
                <a
                  href={`https://drive.google.com/drive/folders/${booking.drive_folder_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline whitespace-nowrap"
                >
                  Open in Drive
                </a>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 p-3 bg-muted/20 rounded-lg border">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase">
                Total
              </Label>
              <p className="text-lg font-bold">
                {formatCurrency(booking.total_amount)}
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase">
                Paid (Deposit)
              </Label>
              <p className="text-lg font-bold text-success">
                {formatCurrency(
                  booking.payments
                    ?.filter((p) => p.status === "success")
                    .reduce((sum, p) => sum + p.amount, 0) || 0,
                )}
              </p>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase">
                Remaining
              </Label>
              <p className="text-lg font-bold text-destructive">
                {formatCurrency(
                  booking.total_amount -
                    (booking.payments
                      ?.filter((p) => p.status === "success")
                      .reduce((sum, p) => sum + p.amount, 0) || 0),
                )}
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
                        {formatCurrency(payment.amount)} - {payment.status}
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
    updates: {
      status: string;
      notes?: string;
      booking_date?: string;
      booking_time?: string;
    },
  ) => Promise<void>;
}) {
  const [status, setStatus] = useState(booking.status);
  const [notes, setNotes] = useState(booking.notes || "");
  const [bookingDate, setBookingDate] = useState(booking.booking_date);
  const [bookingTime, setBookingTime] = useState(booking.booking_time);
  const [isUpdating, setIsUpdating] = useState(false);
  const [open, setOpen] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const updates: any = { status, notes };
      if (bookingDate !== booking.booking_date)
        updates.booking_date = bookingDate;
      if (bookingTime !== booking.booking_time)
        updates.booking_time = bookingTime;

      await onUpdate(booking.id, updates);
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
      <DropdownMenuItem onClick={() => setOpen(true)} closeOnClick={false}>
        <Edit className="w-4 h-4 mr-2" />
        Edit Booking
      </DropdownMenuItem>
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
              onValueChange={(value) => {
                if (value) setStatus(value as typeof status);
              }}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bookingDate">Date</Label>
              <Input
                id="bookingDate"
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bookingTime">Time</Label>
              <Input
                id="bookingTime"
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
              />
            </div>
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
  const { fetchPackages } = usePackagesStore();

  // Fetch bookings and packages on component mount
  useEffect(() => {
    fetchBookings();
    fetchPackages();
  }, [fetchBookings, fetchPackages]);

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

  // Wrapper for updateBooking that shows success toast
  const handleUpdateBooking = async (
    id: string,
    updates: {
      status: string;
      notes?: string;
      booking_date?: string;
      booking_time?: string;
    },
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
              onValueChange={(value) =>
                setFilters({ statusFilter: value || "all" })
              }
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
                          .reduce((sum, p) => sum + p.amount, 0) || 0,
                      )}
                    </TableCell>
                    <TableCell className="text-destructive font-medium">
                      {formatCurrency(
                        booking.total_amount -
                          (booking.payments
                            ?.filter((p) => p.status === "success")
                            .reduce((sum, p) => sum + p.amount, 0) || 0),
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="sm" />}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {booking.user_phone && (
                              <DropdownMenuItem
                                onClick={() => window.open(generateWhatsAppLink(booking), '_blank')}
                                className="cursor-pointer"
                              >
                                <RiWhatsappFill className="w-4 h-4 mr-2 text-[#25D366]" />
                                WhatsApp Message
                              </DropdownMenuItem>
                            )}
                            {booking.user_phone && booking.status === "completed" && (
                              <DropdownMenuItem
                                onClick={() => window.open(generateReviewLink(booking), '_blank')}
                                className="cursor-pointer"
                              >
                                <RiWhatsappFill className="w-4 h-4 mr-2 text-yellow-500" />
                                Request Review
                              </DropdownMenuItem>
                            )}
                            <BookingDetailsDialog booking={booking} />
                            <EditBookingDialog
                              booking={booking}
                              onUpdate={handleUpdateBooking}
                            />
                          </DropdownMenuGroup>
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
