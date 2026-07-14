import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Shield, Clock, DollarSign, Search, Filter } from 'lucide-react';

const FinanceLedger = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/api/staff/audit-logs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(res.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Financial Audit Trail</h1>
          <p className="text-slate-500 font-medium">Monitoring all enrollment transactions and system changes</p>
        </div>
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex space-x-2">
           <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Search size={20}/></button>
           <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Filter size={20}/></button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Timestamp</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Event</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Description</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Initiator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition-all">
                <td className="px-6 py-4 text-xs font-bold text-slate-400">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                    log.action_type.includes('PAYMENT') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {log.action_type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                  {log.description}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                      <Shield size={12} className="text-slate-500" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{log.staff_name || 'SYSTEM'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinanceLedger;
