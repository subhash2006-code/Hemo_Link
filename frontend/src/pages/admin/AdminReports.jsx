// src/pages/admin/AdminReports.jsx — Reports and Export Center
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Printer,
  CheckCircle,
  FileText,
} from 'lucide-react';

export default function AdminReports() {
  const { addToast } = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await adminApi.getReports({ type: reportType });
        setReport(res);
      } catch (err) {
        addToast({ title: 'Failed to load report', message: err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reportType, addToast]);

  function exportCSV() {
    if (!report || !report.bloodGroupSummary) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Blood Group,Registered Donors,Available Donors,Total Requests,Fulfilled Requests\n';

    report.bloodGroupSummary.forEach((row) => {
      csvContent += `${row.blood_group},${row.registeredDonors},${row.availableDonors},${row.totalRequests},${row.fulfilledRequests}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HemoLink_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({ title: 'Report Downloaded', message: 'CSV file generated successfully!', type: 'success' });
  }

  function handlePrint() {
    window.print();
  }

  const metrics = report?.metrics || {};
  const bloodSummary = report?.bloodGroupSummary || [];

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
            System Reports
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Audit compliance, export records, and analyze blood network operations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="admin-btn-refresh" onClick={handlePrint}>
            <Printer size={15} /> Print Report
          </button>
          <button className="admin-action-btn-red" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={exportCSV}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="admin-card" style={{ padding: '12px 18px', display: 'flex', gap: 10, marginBottom: 20 }}>
        {['overview', 'donors', 'requests', 'inventory'].map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: reportType === type ? '#dc2626' : '#f1f5f9',
              color: reportType === type ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {type} Report
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
          Generating report...
        </div>
      ) : (
        <>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="admin-stat-card">
              <div>
                <p className="admin-stat-label">Total Users</p>
                <p className="admin-stat-num">{metrics.totalUsers}</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <div>
                <p className="admin-stat-label">Total Donors</p>
                <p className="admin-stat-num">{metrics.totalDonors}</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <div>
                <p className="admin-stat-label">Total Receivers</p>
                <p className="admin-stat-num">{metrics.totalReceivers}</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <div>
                <p className="admin-stat-label">Total Blood Requests</p>
                <p className="admin-stat-num">{metrics.totalRequests}</p>
              </div>
            </div>
            <div className="admin-stat-card">
              <div>
                <p className="admin-stat-label">Fulfillment Rate</p>
                <p className="admin-stat-num" style={{ color: '#16a34a' }}>{metrics.fulfillmentRate}</p>
              </div>
            </div>
          </div>

          {/* Blood Summary Table */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Blood Group Inventory & Fulfillment Breakdown</h3>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Blood Group</th>
                    <th>Registered Donors</th>
                    <th>Available Donors</th>
                    <th>Total Requests</th>
                    <th>Fulfilled Requests</th>
                    <th>Fulfillment Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {bloodSummary.map((b) => {
                    const ratio = b.totalRequests > 0 ? Math.round((b.fulfilledRequests / b.totalRequests) * 100) : 100;
                    return (
                      <tr key={b.blood_group}>
                        <td>
                          <span className="blood-pill">{b.blood_group}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{b.registeredDonors}</td>
                        <td style={{ color: '#059669', fontWeight: 600 }}>{b.availableDonors}</td>
                        <td>{b.totalRequests}</td>
                        <td>{b.fulfilledRequests}</td>
                        <td>
                          <span className={`badge-status ${ratio >= 70 ? 'badge-status--active' : 'badge-status--pending'}`}>
                            {ratio}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
