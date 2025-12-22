"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  BarChart3,
  Users,
  MapPin,
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  ArrowRight,
  Flag,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { startOfYear, endOfYear } from "date-fns";
import Link from "next/link";
import {
  useDashboardAdmin,
  useUserAnalytics,
  useWalletAnalytics,
  useEventsLocationsTotals,
} from "@/hooks/admin/useDashboardAdmin";
import { useAllReports } from "@/hooks/admin/useDashboardAdmin";
import { cn } from "@/lib/utils";
import { IconBuilding, IconBuildingPlus, IconFlag } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { Report } from "@/types";

// Mapping from API response title to card config
const cardConfigMap: Record<
  string,
  { title: string; icon: LucideIcon; description: string }
> = {
  Users: {
    title: "Users",
    icon: Users,
    description: "Total users",
  },
  Locations: {
    title: "Visible Locations",
    icon: MapPin,
    description: "Total locations",
  },
  Events: {
    title: "Upcoming Events",
    icon: CalendarIcon,
    description: "Total events",
  },
  "Total Wallet Balance": {
    title: "Total Wallet Balance",
    icon: DollarSign,
    description: "System + Escrow",
  },
};

interface SummaryCard {
  title: string;
  value: number;
  icon: LucideIcon;
  description: string;
}

// Color mapping for cards
const getCardColor = (title: string) => {
  switch (title) {
    case "Users":
      return {
        borderLeft: "border-l-4 border-l-blue-500",
        iconBg: "bg-blue-100 dark:bg-blue-950",
        iconColor: "text-blue-600 dark:text-blue-400",
      };
    case "Locations":
      return {
        borderLeft: "border-l-4 border-l-green-500",
        iconBg: "bg-green-100 dark:bg-green-950",
        iconColor: "text-green-600 dark:text-green-400",
      };
    case "Events":
      return {
        borderLeft: "border-l-4 border-l-purple-500",
        iconBg: "bg-purple-100 dark:bg-purple-950",
        iconColor: "text-purple-600 dark:text-purple-400",
      };
    case "Total Wallet Balance":
      return {
        borderLeft: "border-l-4 border-l-amber-500",
        iconBg: "bg-amber-100 dark:bg-amber-950",
        iconColor: "text-amber-600 dark:text-amber-400",
      };
    default:
      return {
        borderLeft: "border-l-4 border-l-gray-500",
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
      };
  }
};

export default function AdminDashboardPage() {
  // Filter state for summary cards
  const [filterType, setFilterType] = useState<"year" | "range">("year");
  const [selectedYear, setSelectedYear] = useState<string>(
    format(new Date(), "yyyy")
  );
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  });

  // Calculate startDate and endDate based on filter
  const dateParams = useMemo(() => {
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (filterType === "year") {
      const start = startOfYear(new Date(parseInt(selectedYear), 0));
      const end = endOfYear(new Date(parseInt(selectedYear), 0));
      startDate = format(start, "yyyy-MM-dd");
      endDate = format(end, "yyyy-MM-dd");
    } else if (filterType === "range") {
      if (dateRange.from && dateRange.to) {
        startDate = format(dateRange.from, "yyyy-MM-dd");
        endDate = format(dateRange.to, "yyyy-MM-dd");
      }
    }

    return { startDate, endDate };
  }, [filterType, selectedYear, dateRange]);

  // Fetch data from API
  const { data: dashboardData, isLoading } = useDashboardAdmin(dateParams);

  // Map data from API to cards
  const summaryCards = useMemo((): SummaryCard[] => {
    if (!dashboardData?.data) {
      return [];
    }

    return dashboardData.data.map((item: { title: string; value: number }) => {
      const config = cardConfigMap[item.title] || {
        title: item.title,
        icon: Users,
        description: "",
      };
      return {
        title: config.title,
        value: item.value,
        icon: config.icon,
        description: config.description,
      };
    });
  }, [dashboardData]);

  const [userGrowthPeriod, setUserGrowthPeriod] = useState<
    "day" | "month" | "year"
  >("day");
  const [revenuePeriod, setRevenuePeriod] = useState<"day" | "month" | "year">(
    "day"
  );
  const [locationEventPeriod, setLocationEventPeriod] = useState<
    "day" | "month" | "year"
  >("month");

  const { data: userAnalyticsData, isLoading: isLoadingUserAnalytics } =
    useUserAnalytics(userGrowthPeriod);

  const { data: walletAnalyticsData, isLoading: isLoadingWalletAnalytics } =
    useWalletAnalytics(revenuePeriod);

  const {
    data: eventsLocationsTotalsData,
    isLoading: isLoadingEventsLocationsTotals,
  } = useEventsLocationsTotals(locationEventPeriod);

  // Fetch recent reports from API
  const { data: allReportsData, isLoading: isLoadingReports } = useAllReports({
    status: "PENDING",
  });

  // Map reports data from API to display format
  const recentReports = useMemo(() => {
    if (!allReportsData?.data || !Array.isArray(allReportsData.data)) {
      return [];
    }

    // Sort by createdAt DESC and take first 3
    const sortedReports = [...allReportsData.data]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 3);

    return sortedReports.map((report: Report) => {
      const reporterName = report.createdBy
        ? `${report.createdBy.firstName} ${report.createdBy.lastName}`.trim()
        : "Unknown";

      let targetText = "";
      if (report.targetType === "event" && report.referencedTargetEvent) {
        // API returns displayName but type definition has title
        const event = report.referencedTargetEvent as {
          displayName?: string;
          title?: string;
        };
        targetText = `Event: ${event.displayName || event.title || "Event"}`;
      } else if (report.targetType === "post" && report.referencedTargetPost) {
        targetText = `Post: ${
          report.referencedTargetPost.content?.substring(0, 50) || "Post"
        }${
          report.referencedTargetPost.content &&
          report.referencedTargetPost.content.length > 50
            ? "..."
            : ""
        }`;
      } else if (
        report.targetType === "location" &&
        report.referencedTargetLocation
      ) {
        targetText = `Location: ${
          report.referencedTargetLocation.name || "Location"
        }`;
      } else {
        targetText = `${report.targetType || "Unknown"}: ${
          report.targetId?.substring(0, 8) || ""
        }`;
      }

      const timeAgo = report.createdAt
        ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })
        : "Unknown";

      return {
        id: report.id,
        type: report.targetType || "unknown",
        title: report.title || "No title",
        reporter: reporterName,
        target: targetText,
        status: report.status || "PENDING",
        createdAt: timeAgo,
      };
    });
  }, [allReportsData]);

  // Get user growth data by time period from API
  const getUserGrowthData = useMemo<
    | { day: string; users: number }[]
    | { month: string; users: number }[]
    | { year: string; users: number }[]
  >(() => {
    if (!userAnalyticsData || isLoadingUserAnalytics) {
      return [];
    }

    if (userGrowthPeriod === "day") {
      return userAnalyticsData
        .filter((item): item is { day: string; count: number } => !!item.day)
        .map((item) => ({
          day: item.day,
          users: item.count,
        }));
    } else if (userGrowthPeriod === "month") {
      return userAnalyticsData
        .filter(
          (item): item is { month: string; count: number } => !!item.month
        )
        .map((item) => ({
          month: item.month,
          users: item.count,
        }));
    } else if (userGrowthPeriod === "year") {
      return userAnalyticsData
        .filter((item): item is { year: string; count: number } => !!item.year)
        .map((item) => ({
          year: item.year,
          users: item.count,
        }));
    }
    return [];
  }, [userAnalyticsData, userGrowthPeriod, isLoadingUserAnalytics]);

  // Get wallet flow data by time period from API
  const getRevenueData = useMemo<
    | { day: string; deposit: number; withdraw: number }[]
    | { month: string; deposit: number; withdraw: number }[]
    | { year: string; deposit: number; withdraw: number }[]
  >(() => {
    if (!walletAnalyticsData || isLoadingWalletAnalytics) {
      return [];
    }

    if (revenuePeriod === "day") {
      return walletAnalyticsData
        .filter(
          (item): item is { day: string; deposit: number; withdraw: number } =>
            !!item.day
        )
        .map((item) => ({
          day: item.day,
          deposit: item.deposit,
          withdraw: item.withdraw,
        }));
    } else if (revenuePeriod === "month") {
      return walletAnalyticsData
        .filter(
          (
            item
          ): item is { month: string; deposit: number; withdraw: number } =>
            !!item.month
        )
        .map((item) => ({
          month: item.month,
          deposit: item.deposit,
          withdraw: item.withdraw,
        }));
    } else if (revenuePeriod === "year") {
      return walletAnalyticsData
        .filter(
          (item): item is { year: string; deposit: number; withdraw: number } =>
            !!item.year
        )
        .map((item) => ({
          year: item.year,
          deposit: item.deposit,
          withdraw: item.withdraw,
        }));
    }
    return [];
  }, [walletAnalyticsData, revenuePeriod, isLoadingWalletAnalytics]);

  // Get Locations vs Events data by time period from API
  const getLocationEventData = useMemo<
    | { day: string; locations: number; events: number }[]
    | { month: string; locations: number; events: number }[]
    | { year: string; locations: number; events: number }[]
  >(() => {
    if (!eventsLocationsTotalsData || isLoadingEventsLocationsTotals) {
      return [];
    }

    if (locationEventPeriod === "day") {
      return eventsLocationsTotalsData
        .filter(
          (
            item
          ): item is {
            day: string;
            events: number;
            locations: number;
          } => !!item.day
        )
        .map((item) => ({
          day: item.day,
          locations: item.locations,
          events: item.events,
        }));
    } else if (locationEventPeriod === "month") {
      return eventsLocationsTotalsData
        .filter(
          (
            item
          ): item is {
            month: string;
            events: number;
            locations: number;
          } => !!item.month
        )
        .map((item) => ({
          month: item.month,
          locations: item.locations,
          events: item.events,
        }));
    } else if (locationEventPeriod === "year") {
      return eventsLocationsTotalsData
        .filter(
          (
            item
          ): item is {
            year: string;
            events: number;
            locations: number;
          } => !!item.year
        )
        .map((item) => ({
          year: item.year,
          locations: item.locations,
          events: item.events,
        }));
    }
    return [];
  }, [
    eventsLocationsTotalsData,
    locationEventPeriod,
    isLoadingEventsLocationsTotals,
  ]);

  // Get key for XAxis
  const getUserGrowthXKey = () => {
    switch (userGrowthPeriod) {
      case "day":
        return "day";
      case "month":
        return "month";
      case "year":
        return "year";
    }
  };

  const getRevenueXKey = () => {
    switch (revenuePeriod) {
      case "day":
        return "day";
      case "month":
        return "month";
      case "year":
        return "year";
    }
  };

  // Get label for tooltip
  const getUserGrowthLabel = (label: string) => {
    switch (userGrowthPeriod) {
      case "day":
        return `Day ${label}`;
      case "month":
        return `Month ${label}`;
      case "year":
        return `Year ${label}`;
    }
  };

  const getRevenueLabel = (label: string) => {
    switch (revenuePeriod) {
      case "day":
        return `Day ${label}`;
      case "month":
        return `Month ${label}`;
      case "year":
        return `Year ${label}`;
    }
  };

  // Get title for chart
  const getUserGrowthTitle = () => {
    switch (userGrowthPeriod) {
      case "day":
        return "User Growth (7 days)";
      case "month":
        return "User Growth (12 months)";
      case "year":
        return "User Growth (5 years)";
    }
  };

  const getRevenueTitle = () => {
    switch (revenuePeriod) {
      case "day":
        return "Wallet Flow (7 days)";
      case "month":
        return "Wallet Flow (12 months)";
      case "year":
        return "Wallet Flow (5 years)";
    }
  };

  const getLocationEventTitle = () => {
    switch (locationEventPeriod) {
      case "day":
        return "Locations vs Events (7 days)";
      case "month":
        return "Locations vs Events (12 months)";
      case "year":
        return "Locations vs Events (5 years)";
    }
  };

  const getLocationEventXKey = () => {
    switch (locationEventPeriod) {
      case "day":
        return "day";
      case "month":
        return "month";
      case "year":
        return "year";
    }
  };

  // Create year list
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => ({
      value: String(currentYear - i),
      label: String(currentYear - i),
    }));
  }, []);
  const router = useRouter();

  return (
    <div className="space-y-8 p-2">
      {/* Filter Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              Filter Time
            </label>
            <Tabs
              value={filterType}
              onValueChange={(value) =>
                setFilterType(value as "year" | "range")
              }
            >
              <TabsList>
                <TabsTrigger value="year">By Year</TabsTrigger>
                <TabsTrigger value="range">Date Range</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex gap-3 items-end">
            {filterType === "year" && (
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {filterType === "range" && (
              <>
                <div className="w-[180px]">
                  <label className="text-xs font-medium mb-1.5 block text-muted-foreground">
                    From Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left font-normal h-9",
                          !dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {dateRange.from ? (
                          format(dateRange.from, "MM/dd/yyyy")
                        ) : (
                          <span className="text-xs">Start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date: Date | undefined) =>
                          setDateRange((prev) => ({ ...prev, from: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="w-[180px]">
                  <label className="text-xs font-medium mb-1.5 block text-muted-foreground">
                    To Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left font-normal h-9",
                          !dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {dateRange.to ? (
                          format(dateRange.to, "MM/dd/yyyy")
                        ) : (
                          <span className="text-xs">End date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date: Date | undefined) =>
                          setDateRange((prev) => ({ ...prev, to: date }))
                        }
                        disabled={(date: Date) =>
                          dateRange.from ? date < dateRange.from : false
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="default"
            onClick={() => router.push("/admin/locations/create")}
          >
            <IconBuildingPlus className="h-4 w-4" />
            New Location
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Summary Cards */}
        <div className="grid gap-4 md:col-span-2 lg:col-span-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : summaryCards.length > 0 ? (
            summaryCards.map((card) => {
              const colors = getCardColor(card.title);
              return (
                <Card
                  key={card.title}
                  className={cn(
                    "hover:shadow-lg transition-shadow",
                    colors.borderLeft
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-md font-medium text-muted-foreground">
                          {card.title}
                        </p>
                        <p className="text-2xl font-bold">
                          {card.title === "Total Wallet Balance"
                            ? formatCurrency(card.value)
                            : card.value.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {card.description}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center",
                          colors.iconBg
                        )}
                      >
                        <card.icon
                          className={cn("h-6 w-6", colors.iconColor)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-4 text-center py-8 text-muted-foreground">
              No data
            </div>
          )}
        </div>
      </div>
      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {getUserGrowthTitle()}
                </CardTitle>
                <CardDescription>
                  {userGrowthPeriod === "day"
                    ? "New registrations per day"
                    : userGrowthPeriod === "month"
                    ? "New registrations per month"
                    : "New registrations per year"}
                </CardDescription>
              </div>
              <Tabs
                value={userGrowthPeriod}
                onValueChange={(value) =>
                  setUserGrowthPeriod(value as "day" | "month" | "year")
                }
              >
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="h-[320px]">
            {isLoadingUserAnalytics ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : getUserGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getUserGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey={getUserGrowthXKey()}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    formatter={(val: number) => `${val.toLocaleString()} user`}
                    labelFormatter={(label) => getUserGrowthLabel(label)}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {getRevenueTitle()}
                </CardTitle>
                <CardDescription>
                  {revenuePeriod === "day"
                    ? "Deposit / Withdraw by day"
                    : revenuePeriod === "month"
                    ? "Deposit / Withdraw by month"
                    : "Deposit / Withdraw by year"}
                </CardDescription>
              </div>
              <Tabs
                value={revenuePeriod}
                onValueChange={(value) =>
                  setRevenuePeriod(value as "day" | "month" | "year")
                }
              >
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="h-[320px]">
            {isLoadingWalletAnalytics ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : getRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey={getRevenueXKey()}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => {
                      if (revenuePeriod === "year") {
                        return `${(v / 1_000_000_000).toFixed(1)}B`;
                      }
                      return `${(v / 1_000_000).toFixed(0)}M`;
                    }}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => getRevenueLabel(label)}
                  />
                  <Legend />
                  <Bar
                    dataKey="deposit"
                    name="Deposit"
                    fill="var(--primary)"
                    radius={6}
                  />
                  <Bar
                    dataKey="withdraw"
                    name="Withdraw"
                    fill="hsl(var(--chart-2))"
                    radius={6}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Locations & Events */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{getLocationEventTitle()}</CardTitle>
                <CardDescription>New creation trend</CardDescription>
              </div>
              <Tabs
                value={locationEventPeriod}
                onValueChange={(value) =>
                  setLocationEventPeriod(value as "day" | "month" | "year")
                }
              >
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="h-[320px]">
            {isLoadingEventsLocationsTotals ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : getLocationEventData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getLocationEventData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey={getLocationEventXKey()}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar
                    dataKey="locations"
                    name="Locations"
                    fill="var(--primary)"
                    radius={6}
                  />
                  <Bar
                    dataKey="events"
                    name="Events"
                    fill="hsl(var(--chart-3))"
                    radius={6}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Recent Reports
            </CardTitle>
            <CardDescription>
              Latest reports that need processing
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col min-h-[320px]">
            <div className="space-y-3 flex-grow">
              {isLoadingReports ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentReports.length > 0 ? (
                recentReports.map((report) => (
                  <Link
                    href={`/admin/reports/${report.id}`}
                    key={report.id}
                    className="block"
                  >
                    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div
                        className={`mt-1 p-1.5 rounded ${
                          report.status === "PENDING"
                            ? "bg-orange-100 dark:bg-orange-950"
                            : "bg-green-100 dark:bg-green-950"
                        }`}
                      >
                        {report.status === "PENDING" ? (
                          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <Flag className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {report.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {report.target}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {report.reporter}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ·
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {report.createdAt}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            report.status === "PENDING"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400"
                              : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          }`}
                        >
                          {report.status === "PENDING" ? "Pending" : "Resolved"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm h-full flex items-center justify-center">
                  No pending reports
                </div>
              )}
            </div>
            <Link href="/admin/reports" className="mt-auto">
              <Button variant="outline" className="w-full mt-2">
                View all reports
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
