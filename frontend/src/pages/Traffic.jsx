import { useState, useEffect, useCallback } from 'react'
import TrafficChart from '../components/TrafficChart'
import ApplicationChart from '../components/ApplicationChart'
import DomainTable from '../components/DomainTable'
import { getTopDomains, getTopApplications, getTrafficVolume } from '../services/api'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const POLL_INTERVAL = 5000

export default function Traffic() {
  const [domains, setDomains] = useState([])
  const [apps, setApps] = useState([])
  const [volume, setVolume] = useState([])
  const [hours, setHours] = useState(24)

  const fetchAll = useCallback(async () => {
    try {
      const [d, a, v] = await Promise.all([
        getTopDomains({ hours }),
        getTopApplications({ hours }),
        getTrafficVolume({ hours }),
      ])
      setDomains(d.data || [])
      setApps(a.data || [])
      setVolume(v.data || [])
    } catch (err) {
      console.error('Traffic fetch error', err)
    }
  }, [hours])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchAll])

  // Bar chart data for top domains
  const barData = {
    labels: domains.map((d) => d.domain),
    datasets: [
      {
        label: 'Requests',
        data: domains.map((d) => d.request_count),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
    ],
  }

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#1f2937', titleColor: '#f3f4f6', bodyColor: '#d1d5db' },
    },
    scales: {
      x: { ticks: { color: '#6b7280' }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#d1d5db' }, grid: { display: false } },
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Traffic Analytics</h1>
        <select
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value={1}>Last 1h</option>
          <option value={6}>Last 6h</option>
          <option value={24}>Last 24h</option>
          <option value={72}>Last 3d</option>
          <option value={168}>Last 7d</option>
        </select>
      </div>

      {/* Line chart: traffic volume over time */}
      <TrafficChart data={volume} />

      {/* Two-column: pie + bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApplicationChart apps={apps} />

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Top Domains by Requests</h3>
          <div className="h-72">
            {domains.length > 0 ? (
              <Bar data={barData} options={barOpts} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-600">
                No domain data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Domain table */}
      <DomainTable domains={domains} />
    </div>
  )
}
