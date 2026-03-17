import { useDrawings } from '@/hooks/useDrawings';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AnalyticsPage() {
  const { data: allDrawings = [] } = useDrawings();

  const statusCounts = [
    { name: 'Working', value: allDrawings.filter(d => d.status === 'working').length, color: 'hsl(210, 70%, 50%)' },
    { name: 'Under Review', value: allDrawings.filter(d => d.status === 'under-review').length, color: 'hsl(270, 60%, 55%)' },
    { name: 'Pending DH', value: allDrawings.filter(d => d.status === 'pending-dept-head').length, color: 'hsl(38, 92%, 50%)' },
    { name: 'Approved', value: allDrawings.filter(d => d.status === 'approved').length, color: 'hsl(145, 63%, 42%)' },
    { name: 'Rejected', value: allDrawings.filter(d => d.status === 'rejected').length, color: 'hsl(0, 72%, 51%)' },
  ];

  const designerNames = [...new Set(allDrawings.map(d => d.profiles?.full_name ?? 'Unknown'))];
  const designerData = designerNames.map(name => ({
    name: name.split(' ')[0],
    total: allDrawings.filter(d => (d.profiles?.full_name ?? 'Unknown') === name).length,
    approved: allDrawings.filter(d => (d.profiles?.full_name ?? 'Unknown') === name && d.status === 'approved').length,
  }));

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Project Analytics" subtitle="Drawing status and team performance" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusCounts.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">Drawings per Designer</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={designerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(220, 60%, 20%)" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="approved" fill="hsl(145, 63%, 42%)" radius={[4, 4, 0, 0]} name="Approved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
