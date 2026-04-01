import React, { useState, useEffect } from 'react';
import { getLogs, getUsers } from '../lib/store';
import { format, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Download, Calendar, TrendingUp, AlertCircle } from 'lucide-react';

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateArrivals: number;
  attendanceRate: number;
}

export function Reports() {
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateArrivals: 0,
    attendanceRate: 0,
  });
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const logs = await getLogs();
      const users = await getUsers();

      const start = parseISO(startDate);
      const end = parseISO(endDate);

      const filteredLogs = logs.filter(log => {
        const logDate = parseISO(log.timestamp);
        return logDate >= start && logDate <= end;
      });

      const userMap = new Map(users.map(u => [u.id, u]));
      const today = new Date().toDateString();

      // Calculate statistics for today
      const todayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today);
      const presentUserIds = new Set(todayLogs.map(l => l.userId));
      const presentToday = presentUserIds.size;
      const absentToday = Math.max(0, users.length - presentToday);
      const attendanceRate = users.length > 0 ? (presentToday / users.length) * 100 : 0;

      // Group logs by employee
      const employeeStats: { [key: string]: any } = {};
      users.forEach(user => {
        employeeStats[user.id] = {
          id: user.id,
          name: user.name,
          employeeId: user.employeeId,
          presentDays: 0,
          totalDays: 0,
          attendanceRate: 0,
        };
      });

      // Count attendance
      const dateMap = new Map<string, Set<string>>();
      filteredLogs.forEach(log => {
        const dateKey = format(parseISO(log.timestamp), 'yyyy-MM-dd');
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, new Set());
        }
        dateMap.get(dateKey)!.add(log.userId);
      });

      // Calculate working days and attendance for each employee
      const workingDays = dateMap.size || 1;
      Object.keys(employeeStats).forEach(userId => {
        let presentDays = 0;
        dateMap.forEach(userIds => {
          if (userIds.has(userId)) presentDays++;
        });
        employeeStats[userId].presentDays = presentDays;
        employeeStats[userId].totalDays = workingDays;
        employeeStats[userId].attendanceRate = ((presentDays / workingDays) * 100).toFixed(1);
      });

      setReportData(Object.values(employeeStats));
      setStats({
        totalEmployees: users.length,
        presentToday,
        absentToday,
        lateArrivals: 0, // Can be calculated if timestamps are captured
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
      });
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  const exportToCSV = () => {
    let csv = 'Employee Name,Employee ID,Present Days,Total Days,Attendance Rate (%)\n';
    reportData.forEach(row => {
      csv += `"${row.name}","${row.employeeId}",${row.presentDays},${row.totalDays},${row.attendanceRate}\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Attendance Reports</h2>
        <p className="text-slate-500">Analyze attendance patterns and generate insights</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Employees</p>
              <p className="text-3xl font-bold text-slate-800">{stats.totalEmployees}</p>
            </div>
            <TrendingUp className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Present Today</p>
              <p className="text-3xl font-bold text-green-600">{stats.presentToday}</p>
            </div>
            <div className="text-4xl font-bold text-green-200">✓</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Absent Today</p>
              <p className="text-3xl font-bold text-red-600">{stats.absentToday}</p>
            </div>
            <AlertCircle className="text-red-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Attendance Rate</p>
              <p className="text-3xl font-bold text-slate-800">{stats.attendanceRate}%</p>
            </div>
            <div className="text-4xl">{stats.attendanceRate >= 75 ? '📈' : '📉'}</div>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Calendar size={16} /> Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Calendar size={16} /> End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={generateReport}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {isLoading ? 'Generating...' : 'Generate Report'}
          </button>
          <button
            onClick={exportToCSV}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Employee Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Employee ID</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Present Days</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Total Days</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Attendance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No attendance data found for the selected date range.
                  </td>
                </tr>
              ) : (
                reportData.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{row.name}</td>
                    <td className="px-6 py-4 text-slate-600">{row.employeeId}</td>
                    <td className="px-6 py-4 text-center text-slate-600">{row.presentDays}</td>
                    <td className="px-6 py-4 text-center text-slate-600">{row.totalDays}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        parseFloat(row.attendanceRate) >= 75
                          ? 'bg-green-100 text-green-700'
                          : parseFloat(row.attendanceRate) >= 50
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {row.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
