"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  type LucideIcon,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStore } from "@/stores/dashboard-store";

// Types are now imported from the store

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p className="text-xs text-green-600 flex items-center mt-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { color: "text-yellow-600 bg-yellow-100", icon: AlertCircle },
    confirmed: { color: "text-green-600 bg-green-100", icon: CheckCircle },
    cancelled: { color: "text-red-600 bg-red-100", icon: XCircle },
    completed: { color: "text-blue-600 bg-blue-100", icon: CheckCircle },
  };

  const { color, icon: Icon } =
    config[status as keyof typeof config] || config.pending;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function AdminDashboard() {
  const {
    stats,
    recentBookings,
    loading,
    error,
    fetchDashboardData,
    clearError,
  } = useDashboardStore();

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Show error as toast if needed
  useEffect(() => {
    if (error) {
      // Could add toast here if needed
    }
  }, [error]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to the admin panel</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Index is stable for static skeleton array
            <Card key={`skeleton-card-${i}`} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to the admin panel</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button
                onClick={() => {
                  clearError();
                  fetchDashboardData();
                }}
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    `€${(amount || 0).toLocaleString()}`;
  const conversionRate =
    stats && stats.total_bookings > 0
      ? ((stats.confirmed_bookings / stats.total_bookings) * 100).toFixed(1)
      : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Istanbul Photographer admin panel
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/dashboard/bookings">View All Bookings</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.total_revenue || 0)}
            icon={DollarSign}
            description={`€${(stats.monthly_revenue || 0).toLocaleString()} this month`}
            trend={
              (stats.monthly_revenue || 0) > 0
                ? "Active revenue stream"
                : undefined
            }
          />
          <StatCard
            title="Total Bookings"
            value={stats.total_bookings || 0}
            icon={Calendar}
            description={`${conversionRate}% conversion rate`}
          />
          <StatCard
            title="Customers"
            value={stats.total_customers || 0}
            icon={Users}
            description="Total registered customers"
          />
          <StatCard
            title="Payment Success"
            value={`${(stats.total_payments || 0) > 0 ? Math.round(((stats.successful_payments || 0) / (stats.total_payments || 1)) * 100) : 0}%`}
            icon={CreditCard}
            description={`${stats.successful_payments || 0}/${stats.total_payments || 0} successful`}
          />
        </div>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Bookings
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending_bookings || 0}
              </div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Confirmed Bookings
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.confirmed_bookings || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for sessions
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Cancelled Bookings
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.cancelled_bookings || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Cancelled by customers
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Bookings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Latest booking activities
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/dashboard/bookings">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent bookings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{booking.user_name}</p>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.user_email} • {booking.package_id} package
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.booking_date} at {booking.booking_time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(booking.total_amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
