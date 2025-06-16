
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, DollarSign, Users, Download, Eye } from 'lucide-react';

interface DailyReport {
  date: string;
  totalCustomers: number;
  delivered: number;
  missed: number;
  totalRevenue: number;
}

interface MonthlyReport {
  month: string;
  year: number;
  totalDays: number;
  deliveryRate: number;
  totalRevenue: number;
  activeCustomers: number;
}

const ReportsOverview = () => {
  const [selectedMonth, setSelectedMonth] = useState('June');
  const [selectedYear, setSelectedYear] = useState('2025');

  // Mock data for demonstration - sorted by date (newest first)
  const dailyReports: DailyReport[] = [
    { date: '2025-06-07', totalCustomers: 25, delivered: 23, missed: 2, totalRevenue: 5750 },
    { date: '2025-06-06', totalCustomers: 25, delivered: 24, missed: 1, totalRevenue: 6000 },
    { date: '2025-06-05', totalCustomers: 25, delivered: 22, missed: 3, totalRevenue: 5500 },
    { date: '2025-06-04', totalCustomers: 25, delivered: 25, missed: 0, totalRevenue: 6250 },
    { date: '2025-06-03', totalCustomers: 25, delivered: 21, missed: 4, totalRevenue: 5250 },
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const monthlyReport: MonthlyReport = {
    month: 'June',
    year: 2025,
    totalDays: 30,
    deliveryRate: 92.5,
    totalRevenue: 172500,
    activeCustomers: 25
  };

  // Ordered months array
  const monthsInOrder = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Years in descending order (newest first)
  const yearsInOrder = ['2026', '2025', '2024'];

  const exportDailyReport = () => {
    const headers = ['Date', 'Total Customers', 'Delivered', 'Missed', 'Success Rate %', 'Revenue ₹'];
    const csvData = dailyReports.map(report => [
      report.date,
      report.totalCustomers,
      report.delivered,
      report.missed,
      ((report.delivered / report.totalCustomers) * 100).toFixed(1),
      report.totalRevenue
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-reports-${selectedMonth}-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportMonthlyReport = () => {
    const data = [
      ['KC Farms - Monthly Report'],
      [''],
      ['Month', `${selectedMonth} ${selectedYear}`],
      ['Total Working Days', monthlyReport.totalDays],
      ['Active Customers', monthlyReport.activeCustomers],
      ['Overall Delivery Rate', `${monthlyReport.deliveryRate}%`],
      ['Total Revenue', `₹${monthlyReport.totalRevenue}`],
      ['Average Daily Revenue', `₹${(monthlyReport.totalRevenue / monthlyReport.totalDays).toFixed(0)}`],
      [''],
      ['Generated on', new Date().toLocaleDateString()]
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-report-${selectedMonth}-${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Month/Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Reports Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-gray-700">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthsInOrder.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearsInOrder.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Monthly Summary - {selectedMonth} {selectedYear}</CardTitle>
            <Button onClick={exportMonthlyReport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Monthly
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{monthlyReport.activeCustomers}</div>
              <div className="text-sm text-gray-600">Active Customers</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{monthlyReport.deliveryRate}%</div>
              <div className="text-sm text-gray-600">Delivery Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">₹{monthlyReport.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600">{monthlyReport.totalDays}</div>
              <div className="text-sm text-gray-600">Working Days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Reports */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Daily Reports</CardTitle>
            <Button onClick={exportDailyReport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Daily
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dailyReports.map((report) => {
              const successRate = ((report.delivered / report.totalCustomers) * 100).toFixed(1);
              const isToday = report.date === new Date().toISOString().split('T')[0];
              
              return (
                <div key={report.date} className={`p-4 border rounded-lg ${isToday ? 'border-blue-300 bg-blue-50' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {new Date(report.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </h3>
                        {isToday && <Badge>Today</Badge>}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Delivered:</span>
                          <span className="font-medium text-green-600 ml-1">{report.delivered}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Missed:</span>
                          <span className="font-medium text-red-600 ml-1">{report.missed}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Success:</span>
                          <span className="font-medium text-blue-600 ml-1">{successRate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Revenue:</span>
                          <span className="font-medium text-green-600 ml-1">₹{report.totalRevenue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsOverview;
