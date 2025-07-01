"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  ShoppingCart,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

// Mock data for sales trend
const salesData = [
  { month: "Jan", sales: 42000, fill: "var(--chart-3)" },
  { month: "Feb", sales: 45000, fill: "var(--chart-3)" },
  { month: "Mar", sales: 48000, fill: "var(--chart-3)" },
  { month: "Apr", sales: 43000, fill: "var(--chart-3)" },
  { month: "May", sales: 49000, fill: "var(--chart-3)" },
  { month: "Jun", sales: 52000, fill: "var(--chart-3)" },
  { month: "Jul", sales: 55000, fill: "var(--chart-3)" },
];

// Mock data for category distribution
const categoryData = [
  { name: "Produce", value: 35, fill: "var(--chart-1)" },
  { name: "Dairy", value: 25, fill: "var(--chart-2)" },
  { name: "Meat", value: 20, fill: "var(--chart-3)" },
  { name: "Bakery", value: 15, fill: "var(--chart-4)" },
  { name: "Beverages", value: 5, fill: "var(--chart-5)" },
];

// Mock data for recent orders
const recentOrders = [
  {
    id: "ORD001",
    date: "2024-01-20",
    customer: "John Doe",
    total: 156.78,
    status: "Completed",
  },
  {
    id: "ORD002",
    date: "2024-01-20",
    customer: "Jane Smith",
    total: 89.99,
    status: "Processing",
  },
  {
    id: "ORD003",
    date: "2024-01-19",
    customer: "Bob Wilson",
    total: 234.56,
    status: "Completed",
  },
  {
    id: "ORD004",
    date: "2024-01-19",
    customer: "Alice Brown",
    total: 67.89,
    status: "Completed",
  },
  {
    id: "ORD005",
    date: "2024-01-19",
    customer: "Charlie Davis",
    total: 123.45,
    status: "Processing",
  },
  {
    id: "ORD006",
    date: "2024-01-18",
    customer: "Eva Martinez",
    total: 198.76,
    status: "Completed",
  },
  {
    id: "ORD007",
    date: "2024-01-18",
    customer: "David Lee",
    total: 145.67,
    status: "Completed",
  },
  {
    id: "ORD008",
    date: "2024-01-18",
    customer: "Grace Taylor",
    total: 78.9,
    status: "Processing",
  },
  {
    id: "ORD009",
    date: "2024-01-17",
    customer: "Frank Johnson",
    total: 167.89,
    status: "Completed",
  },
  {
    id: "ORD010",
    date: "2024-01-17",
    customer: "Helen White",
    total: 89.99,
    status: "Completed",
  },
];

// Mock data for top items
const topItems = [
  { rank: 1, name: "Product A", sales: 2345, revenue: 1172.5 },
  { rank: 2, name: "Product B", sales: 2100, revenue: 8400.0 },
  { rank: 3, name: "Product C", sales: 1890, revenue: 5670.0 },
  { rank: 4, name: "Product D", sales: 1654, revenue: 8270.0 },
  { rank: 5, name: "Product E", sales: 1432, revenue: 10024.0 },
  { rank: 6, name: "Product F", sales: 1345, revenue: 4035.0 },
  { rank: 7, name: "Product G", sales: 1234, revenue: 4936.0 },
  { rank: 8, name: "Product H", sales: 1198, revenue: 2396.0 },
  { rank: 9, name: "Product I", sales: 1156, revenue: 17340.0 },
  { rank: 10, name: "Product J", sales: 1089, revenue: 5445.0 },
];

// Chart configurations
const salesChartConfig = {
  sales: {
    label: "Monthly Sales",
    color: "hsl(var(--chart-3))",
  },
};
const categoryChartConfig = {
  value: {
    label: "Value",
  },
  produce: {
    label: "Produce",
    color: "hsl(var(--chart-1))",
  },
  dairy: {
    label: "Dairy",
    color: "hsl(var(--chart-2))",
  },
  meat: {
    label: "Meat",
    color: "hsl(var(--chart-3))",
  },
  bakery: {
    label: "Bakery",
    color: "hsl(var(--chart-4))",
  },
  beverages: {
    label: "Beverages",
    color: "hsl(var(--chart-5))",
  },
};
// Add these new interfaces
interface TimeFilterData {
  totalSales: number;
  avgSales: number;
  salesGoal: number;
}

// Add the time filter data
const timeFilterData: Record<string, TimeFilterData> = {
  "7days": {
    totalSales: 82000,
    avgSales: 11714,
    salesGoal: 100000,
  },
  "30days": {
    totalSales: 345000,
    avgSales: 11500,
    salesGoal: 350000,
  },
  "3months": {
    totalSales: 980000,
    avgSales: 10889,
    salesGoal: 1000000,
  },
  "1year": {
    totalSales: 4250000,
    avgSales: 11849,
    salesGoal: 5000000,
  },
};

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState("30days");
  const currentData = timeFilterData[timeFilter];

  // Replace the existing calculations with the filtered data
  const totalSales = currentData.totalSales;
  const avgSales = currentData.avgSales;
  const salesGoal = currentData.salesGoal;
  const salesGoalProgress = (totalSales / salesGoal) * 100;

  return (
    <div className="container mx-auto flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="3months">Last 3 months</SelectItem>
            <SelectItem value="1year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalSales.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              <ArrowUp className="inline h-4 w-4 text-green-500" />
              +12.5% from last period
            </div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Average Monthly Sales
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${avgSales.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              <ArrowUp className="inline h-4 w-4 text-green-500" />
              +5.2% from last month
            </div>
          </CardContent>
        </Card>
        <Card className="w-full sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Sales Goal Progress
            </CardTitle>
            <Target className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesGoalProgress.toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Target: ${salesGoal.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Monthly Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={salesChartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={salesData}
                  margin={{ top: 10, right: 10, bottom: 20, left: 40 }}
                >
                  <XAxis dataKey="month" />
                  <YAxis width={35} />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke={salesData[0].fill}
                    strokeWidth={2}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={categoryChartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ payload }) => payload.name}
                  >
                    {/* No need for explicit Cell components */}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      {new Date(order.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                          order.status === "Completed"
                            ? "bg-[var(--chart-1-foreground)]/10 text-[var(--chart-1)]"
                            : "bg-[var(--chart-2-foreground)]/10 text-[var(--chart-2)]"
                        }`}
                      >
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">${order.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Units Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topItems.map((product) => (
                  <TableRow key={product.rank}>
                    <TableCell>{product.rank}</TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.sales}
                    </TableCell>
                    <TableCell className="text-right">
                      ${product.revenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
