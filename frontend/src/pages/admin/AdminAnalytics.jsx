// src/pages/admin/AdminAnalytics.jsx — Analytics and Metrics
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminApi } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminApi.getAnalytics();
        setAnalytics(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const supplyDemand = analytics?.supplyDemand || [];
  const topCities = analytics?.topCities || [];
  const urgencyBreakdown = analytics?.urgencyBreakdown || [];
  const statusBreakdown = analytics?.statusBreakdown || { open: 0, fulfilled: 0, cancelled: 0 };
  const monthlyTrends = analytics?.monthlyTrends || [];

  const maxDonors = Math.max(...supplyDemand.map((s) => Math.max(s.donors, s.requests, 1)), 10);

  return (
    <AdminLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
          Platform Analytics
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
          Real-time metrics on blood group supply versus demand, regional distribution, and fulfillment rates.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
          Calculating network analytics...
        </div>
      ) : (
        <>
          {/* Top Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="admin-stat-label">Fulfilled Requests</p>
                <p className="admin-stat-num">{statusBreakdown.fulfilled}</p>
                <p className="admin-stat-trend" style={{ color: '#059669' }}>Completed Safely</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
                <Activity size={22} />
              </div>
              <div>
                <p className="admin-stat-label">Open Active Requests</p>
                <p className="admin-stat-num">{statusBreakdown.open}</p>
                <p className="admin-stat-trend" style={{ color: '#d97706' }}>Seeking Donors</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon-wrap" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <AlertCircle size={22} />
              </div>
              <div>
                <p className="admin-stat-label">Critical Cases</p>
                <p className="admin-stat-num">
                  {urgencyBreakdown.find((u) => u.urgency === 'Critical')?.count || 0}
                </p>
                <p className="admin-stat-trend" style={{ color: '#dc2626' }}>Priority ICU</p>
              </div>
            </div>
          </div>

          {/* Blood Group Supply vs Demand Chart */}
          <div className="admin-card" style={{ padding: '24px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>
                  Blood Group Supply (Donors) vs Demand (Requests)
                </h3>
                <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
                  Comparing registered donor inventory with patient transfusion requests.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, background: '#dc2626', borderRadius: 3 }} /> Donors (Supply)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, background: '#f97316', borderRadius: 3 }} /> Requests (Demand)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {supplyDemand.map((item) => {
                const donorPercent = Math.min(100, Math.round((item.donors / maxDonors) * 100));
                const requestPercent = Math.min(100, Math.round((item.requests / maxDonors) * 100));
                return (
                  <div key={item.blood_group} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span className="blood-pill" style={{ width: 48 }}>
                      {item.blood_group}
                    </span>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {/* Donors bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            height: 10,
                            borderRadius: 6,
                            background: '#dc2626',
                            width: `${Math.max(4, donorPercent)}%`,
                            transition: 'width 0.5s ease',
                          }}
                        />
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                          {item.donors} donors
                        </span>
                      </div>
                      {/* Requests bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            height: 10,
                            borderRadius: 6,
                            background: '#f97316',
                            width: `${Math.max(4, requestPercent)}%`,
                            transition: 'width 0.5s ease',
                          }}
                        />
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                          {item.requests} requests
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Regional & Urgency Two Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {/* Top Cities */}
            <div className="admin-card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={18} color="#dc2626" /> Top Cities by Request Volume
              </h3>
              {topCities.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: 13 }}>No location data yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topCities.map((c, i) => (
                    <div key={c.city} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, borderBottom: '1px solid #f1f5f9', paddingBottom: 8 }}>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>
                        {i + 1}. {c.city}
                      </span>
                      <span className="badge-status badge-status--pending">
                        {c.count} {c.count === 1 ? 'request' : 'requests'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Trend Indicator */}
            <div className="admin-card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="#16a34a" /> 6-Month Velocity Growth
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 160, paddingTop: 20 }}>
                {monthlyTrends.map((m) => (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 28,
                        height: `${Math.min(100, m.requests * 2)}%`,
                        background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: 12,
                      }}
                      title={`${m.requests} requests`}
                    />
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{m.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
