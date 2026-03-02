"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Eye,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  TrendingUp,
  Users,
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
import { type Customer, useCustomersStore } from "@/stores/customers-store";

function CustomerDetailsDialog({ customer }: { customer: Customer }) {
  const formatCurrency = (amount: number) => `€${amount.toLocaleString()}`;
  const averageSpent =
    customer.confirmed_bookings > 0
      ? customer.total_value / customer.confirmed_bookings
      : 0;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>
            Complete profile and booking history for {customer.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  CONTACT INFORMATION
                </Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  REGISTRATION
                </Label>
                <p className="text-sm mt-1">
                  {new Date(customer.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  BOOKING STATISTICS
                </Label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Bookings:</span>
                    <span className="text-sm font-medium">
                      {customer.bookings_count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Confirmed:</span>
                    <span className="text-sm font-medium">
                      {customer.confirmed_bookings}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-sm">Total Value:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(customer.total_value)}
                    </span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span className="text-sm">Total Paid (Deposit):</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(customer.total_paid)}
                    </span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span className="text-sm">Outstanding:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(customer.outstanding_balance)}
                    </span>
                  </div>
                </div>
              </div>

              {customer.last_booking_date && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    LAST BOOKING
                  </Label>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">
                      {new Date(
                        customer.last_booking_date,
                      ).toLocaleDateString()}
                    </p>
                    <Badge
                      variant={
                        customer.last_booking_status === "confirmed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {customer.last_booking_status}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking History */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              BOOKING HISTORY
            </Label>
            {customer.bookings && customer.bookings.length > 0 ? (
              <div className="mt-3 space-y-3">
                {customer.bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{booking.package_id}</Badge>
                        <Badge
                          variant={
                            booking.status === "confirmed"
                              ? "default"
                              : booking.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.booking_date} at {booking.booking_time}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Booked on{" "}
                        {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(booking.total_amount)}
                      </p>
                      {booking.payments && booking.payments.length > 0 && (
                        <p className="text-xs text-success">
                          Paid:{" "}
                          {formatCurrency(
                            booking.payments
                              .filter((p) => p.status === "success")
                              .reduce((sum, p) => sum + p.amount, 0)
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No bookings yet</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CustomerTypeLabel({ customer }: { customer: Customer }) {
  if (customer.confirmed_bookings === 0)
    return <Badge variant="outline">New</Badge>;
  if (customer.confirmed_bookings === 1)
    return <Badge variant="secondary">Regular</Badge>;
  if (customer.confirmed_bookings >= 2)
    return <Badge variant="default">VIP</Badge>;
  return null;
}

export default function CustomersPage() {
  const {
    customers,
    pagination,
    loading,
    error,
    filters,
    stats,
    fetchCustomers,
    setFilters,
    setPage,
    clearError,
  } = useCustomersStore();

  const { search, sortBy, sortOrder } = filters;

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

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

  // Extract stats for easier access
  const {
    totalCustomers,
    totalRevenue,
    avgRevenuePerCustomer,
    repeatCustomers,
    repeatCustomerRate,
  } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          Manage your customer database and analytics
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Revenue/Customer
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(avgRevenuePerCustomer)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per customer lifetime value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Repeat Customers
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repeatCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {repeatCustomerRate.toFixed(1)}% repeat rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total CLV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer lifetime value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
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
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="total_spent-desc">
                  Highest Spenders
                </SelectItem>
                <SelectItem value="total_spent-asc">Lowest Spenders</SelectItem>
                <SelectItem value="bookings_count-desc">
                  Most Bookings
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No customers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Last Booking</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined{" "}
                          {new Date(customer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{customer.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.bookings_count}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.confirmed_bookings} confirmed
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(customer.total_value)}
                    </TableCell>
                    <TableCell className="text-success">
                      {formatCurrency(customer.total_paid)}
                    </TableCell>
                    <TableCell className="text-destructive font-medium">
                      {formatCurrency(customer.outstanding_balance)}
                    </TableCell>
                    <TableCell>
                      {customer.last_booking_date ? (
                        <div>
                          <p className="text-sm">
                            {new Date(
                              customer.last_booking_date,
                            ).toLocaleDateString()}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {customer.last_booking_status}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Never
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <CustomerTypeLabel customer={customer} />
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
                          <CustomerDetailsDialog customer={customer} />
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
            {pagination.total} customers
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
