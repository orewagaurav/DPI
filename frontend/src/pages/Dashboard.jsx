import { useState, useEffect, useCallback } from 'react'
import StatCard from '../components/StatCard'
import TrafficChart from '../components/TrafficChart'
import DomainTable from '../components/DomainTable'
import ApplicationChart from '../components/ApplicationChart'
import AlertsTable from '../components/AlertsTable'
import { getStats, getTopDomains, getTopApplications, getTrafficVolume } from '../services/api'

const POLL_INTERVAL = 5000

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [domains, setDomains] = useState([])
  const [apps, setApps] = useState([])
  const [volume, setVolume] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const [s, d, a, v] = await Promise.all([
        getStats(),
        getTopDomains(),
        getTopApplications(),
        getTrafficVolume(),
      ])
      setStats(s)
      setDomains(d.data || [])
      setApps(a.data || [])
      setVolume(v.data || [])
    } catch (err) {
      console.error('Dashboard fetch error', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [fetchAll])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <span className="text-xs text-gray-500">
          Auto-refresh every {POLL_INTERVAL / 1000}s
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Packets"
          value={stats?.total_packets?.toLocaleString()}
          icon="📦"
          color="blue"
        />
        <StatCard
          title="Total Bytes"
          value={formatBytes(stats?.total_bytes)}
          icon="📡"
          color="cyan"
        />
        <StatCard
          title="Top Domains"
          value={domains.length}
          icon="🌐"
          color="green"
        />
        <StatCard
          title="Top Apps"
          value={apps.length}
          icon="📱"
          color="purple"
        />
        <StatCard
          title="Blocked"
          value={stats?.blocked_traffic_count?.toLocaleString()}
          icon="🚫"
          color="red"
        />
        <StatCard
          title="Alerts"
          value={stats?.security_alerts_count?.toLocaleString()}
          icon="🔔"
          color="yellow"
        />
      </div>

      {/* Traffic volume chart */}
      <TrafficChart data={volume} />

      {/* Two-column: app chart + domain table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ApplicationChart apps={apps} />
        <DomainTable domains={domains} />
      </div>
    </div>
  )
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
