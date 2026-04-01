import React, { useState, useEffect } from 'react';
import { getUsers } from '../lib/store';
import { format } from 'date-fns';
import { Trash2, AlertCircle } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  registeredAt: string;
  descriptor: number[];
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadEmployees = async () => {
    const data = await getUsers();
    setEmployees(data as Employee[]);
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setEmployees(employees.filter(emp => emp.id !== id));
        setDeleteId(null);
      }
    } catch (err) {
      console.error('Error deleting employee:', err);
      alert('Failed to delete employee');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Employee Management</h2>
        <p className="text-slate-500">View and manage registered employees</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <input
          type="text"
          placeholder="Search by name or employee ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Employee Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Employee ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Registered Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Face Data</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {employees.length === 0 ? 'No employees registered yet.' : 'No employees match your search.'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{emp.name}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.employeeId}</td>
                    <td className="px-6 py-4 text-slate-600">{format(new Date(emp.registeredAt), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        ✓ Stored
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleDelete(emp.id)}
                          disabled={isLoading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete employee"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start gap-4">
          <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900">Total Employees: {employees.length}</h3>
            <p className="text-blue-700 text-sm mt-1">
              {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} matching your search
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
