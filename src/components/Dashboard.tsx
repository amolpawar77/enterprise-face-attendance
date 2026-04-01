import React, { useState, useEffect } from 'react';
import { getLogs, getUsers, AttendanceLog, logAttendance } from '../lib/store';
import { format, parseISO } from 'date-fns';
import { Users, Clock, CheckCircle2, RefreshCw, Search } from 'lucide-react';

export function Dashboard() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AttendanceLog[]>([]);
  const [stats, setStats] = useState({ totalEmployees: 0, todayLogs: 0, presentToday: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    const allLogs = await getLogs();
    setLogs(allLogs);
    setFilteredLogs(allLogs);

    const users = await getUsers();
    const today = new Date().toDateString();
    const todayLogs = allLogs.filter(l => new Date(l.timestamp).toDateString() === today).length;
    const presentToday = new Set(allLogs
      .filter(l => new Date(l.timestamp).toDateString() === today)
      .map(l => l.userId)).size;

    setStats({
      totalEmployees: users.length,
      todayLogs,
      presentToday
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter logs based on search
  useEffect(() => {
    const filtered = logs.filter(log =>
      log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(filtered);
  }, [searchTerm, logs]);

  const handleTestLog = async () => {
    setIsLoading(true);
    setTestMessage(null);
    try {
      const users = await getUsers();
      if (users.length === 0) {
        setTestMessage({ type: 'error', text: 'No employees registered yet!' });
        return;
      }
      const firstUser = users[0];
      const result = await logAttendance(firstUser.id);
      if (result) {
        setTestMessage({ type: 'success', text: `✅ Logged attendance for ${result.name}` });
        await fetchData();
      } else {
        setTestMessage({ type: 'error', text: '❌ Failed to log attendance' });
      }
    } catch (err) {
      setTestMessage({ type: 'error', text: '❌ Error creating test log' });
      console.error(err);
    } finally {
      setIsLoading(false);
      setTimeout(() => setTestMessage(null), 3000);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Employees</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalEmployees}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Present Today</p>
            <p className="text-2xl font-bold text-slate-800">{stats.presentToday}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Today's Logs</p>
            <p className="text-2xl font-bold text-slate-800">{stats.todayLogs}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Recent Attendance Logs</h3>
          <button
            onClick={handleTestLog}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Testing...' : 'Test Log'}
          </button>
        </div>
        {testMessage && (
          <div className={`px-6 py-3 ${testMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} border-b border-slate-200 text-sm font-medium`}>
            {testMessage.text}
          </div>
        )}
        
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg">
            <Search size={18} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">Employee Name</th>
                <th className="px-6 py-3 font-medium">Employee ID</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {logs.length === 0 ? 'No attendance logs found.' : 'No results matching your search.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 20).map(log => {
                  const date = new Date(log.timestamp);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{log.name}</td>
                      <td className="px-6 py-4 text-slate-500">{log.employeeId}</td>
                      <td className="px-6 py-4 text-slate-500">{format(date, 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 text-slate-500">{format(date, 'hh:mm a')}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          Present
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
