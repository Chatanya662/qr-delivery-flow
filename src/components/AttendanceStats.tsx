
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown, Clock, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AttendanceStatsProps {
  customerId?: string;
  customerName?: string;
  showTitle?: boolean;
}

interface AttendanceData {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
  currentMonth: string;
  currentYear: number;
  todayDate: string;
}

const AttendanceStats = ({ customerId, customerName, showTitle = true }: AttendanceStatsProps) => {
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendanceRate: 0,
    currentMonth: '',
    currentYear: 0,
    todayDate: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
  }, [customerId]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Get current date information
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
      const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0];
      const currentDay = currentDate.getDate();
      const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
      const todayDateString = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      let query = supabase
        .from('delivery_records')
        .select('status, delivery_date')
        .gte('delivery_date', startOfMonth)
        .lte('delivery_date', endOfMonth);

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching attendance data:', error);
        return;
      }

      // Calculate attendance statistics
      // Only count days up to today for current month
      const totalDaysToCount = currentDay;
      
      const presentDays = data?.filter(record => record.status === 'delivered').length || 0;
      const absentDays = Math.max(0, totalDaysToCount - presentDays);
      const attendanceRate = totalDaysToCount > 0 ? (presentDays / totalDaysToCount) * 100 : 0;

      setAttendanceData({
        totalDays: totalDaysToCount,
        presentDays,
        absentDays,
        attendanceRate,
        currentMonth: monthName,
        currentYear: year,
        todayDate: todayDateString
      });

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading attendance data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {customerName ? `${customerName} - Attendance Stats` : 'Monthly Attendance Statistics'}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Current Date Info */}
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">Today</span>
          </div>
          <p className="text-sm text-blue-700">{attendanceData.todayDate}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{attendanceData.totalDays}</div>
            <div className="text-xs text-gray-600">Total Days</div>
            <div className="text-xs text-gray-500 mt-1">
              (Till Today)
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{attendanceData.presentDays}</div>
            <div className="text-xs text-gray-600">Present Days</div>
            <div className="text-xs text-gray-500 mt-1">
              Delivered
            </div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <TrendingDown className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold text-red-600">{attendanceData.absentDays}</div>
            <div className="text-xs text-gray-600">Absent Days</div>
            <div className="text-xs text-gray-500 mt-1">
              Missed
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Badge className={`text-lg px-3 py-1 ${
              attendanceData.attendanceRate >= 90 ? 'bg-green-100 text-green-800' :
              attendanceData.attendanceRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {attendanceData.attendanceRate.toFixed(1)}%
            </Badge>
            <div className="text-xs text-gray-600 mt-2">Attendance Rate</div>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-600 bg-gray-50 p-2 rounded">
          <p className="font-medium">{attendanceData.currentMonth} {attendanceData.currentYear} Statistics</p>
          <p className="text-xs">Updated as of today • Counts only days up to current date</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceStats;
