import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Ticket, Calendar, Server, ArrowUp, Activity, Loader2, Play, Square, RotateCcw } from 'lucide-react';
import { useAdminDashboard } from '@/hooks/useAdmin';
import { useServerStatus, useStartServer, useStopServer, useRestartServer } from '@/hooks/useServer';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { data: dashboardData, isLoading, error } = useAdminDashboard();
  const { data: serverStatus } = useServerStatus();
  const startServer = useStartServer();
  const stopServer = useStopServer();
  const restartServer = useRestartServer();

  const handleStartServer = async () => {
    try {
      await startServer.mutateAsync();
      toast.success('Server startar...');
    } catch {
      toast.error('Kunde inte starta servern');
    }
  };

  const handleStopServer = async () => {
    try {
      await stopServer.mutateAsync();
      toast.success('Server stoppad');
    } catch {
      toast.error('Kunde inte stoppa servern');
    }
  };

  const handleRestartServer = async () => {
    try {
      await restartServer.mutateAsync();
      toast.success('Server startar om...');
    } catch {
      toast.error('Kunde inte starta om servern');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Laddar dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">Ett fel uppstod vid laddning av dashboard.</p>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalUsers: 0,
    newUsersToday: 0,
    openTickets: 0,
    pendingApplications: 0,
  };

  const recentActivity = dashboardData?.recentActivity || [];

  const statCards = [
    { label: 'Totalt användare', value: stats.totalUsers.toString(), change: '+12', trend: 'up', icon: Users },
    { label: 'Nya idag', value: stats.newUsersToday.toString(), change: `+${stats.newUsersToday}`, trend: 'up', icon: ArrowUp },
    { label: 'Öppna tickets', value: stats.openTickets.toString(), change: '-2', trend: 'down', icon: Ticket },
    { label: 'Väntande ansökningar', value: stats.pendingApplications.toString(), change: '+1', trend: 'up', icon: Calendar },
  ];

  const server = serverStatus || {
    isOnline: false,
    players: 0,
    maxPlayers: 64,
    cpu: 0,
    memory: 0,
    uptime: 0,
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Välkommen till admin panelen</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary-600/20">
                <stat.icon className="w-5 h-5 text-primary-400" />
              </div>
              <span className={`text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {stat.change}
              </span>
            </div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Server Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <div className="card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold">Server Status</h2>
              <div className={`flex items-center gap-2 text-sm ${server.isOnline ? 'text-green-400' : 'text-red-400'}`}>
                <span className={`w-2 h-2 rounded-full ${server.isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                {server.isOnline ? 'Online' : 'Offline'}
              </div>
            </div>

            <div className="space-y-4">
              {/* Players */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Spelare</span>
                  <span>{server.players}/{server.maxPlayers}</span>
                </div>
                <div className="h-2 bg-background-darker rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                    style={{ width: `${(server.players / server.maxPlayers) * 100}%` }}
                  />
                </div>
              </div>

              {/* CPU */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">CPU</span>
                  <span>{server.cpu}%</span>
                </div>
                <div className="h-2 bg-background-darker rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${server.cpu > 80 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${server.cpu}%` }}
                  />
                </div>
              </div>

              {/* Memory */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Minne</span>
                  <span>{server.memory}%</span>
                </div>
                <div className="h-2 bg-background-darker rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${server.memory > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${server.memory}%` }}
                  />
                </div>
              </div>

              {/* Uptime */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-green-400">{formatUptime(server.uptime)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              {server.isOnline ? (
                <>
                  <button
                    onClick={handleRestartServer}
                    disabled={restartServer.isPending}
                    className="btn-secondary flex-1 text-sm"
                  >
                    {restartServer.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><RotateCcw className="w-4 h-4" /> Restart</>}
                  </button>
                  <button
                    onClick={handleStopServer}
                    disabled={stopServer.isPending}
                    className="btn-danger flex-1 text-sm"
                  >
                    {stopServer.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><Square className="w-4 h-4" /> Stop</>}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleStartServer}
                  disabled={startServer.isPending}
                  className="btn-primary flex-1 text-sm"
                >
                  {startServer.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><Play className="w-4 h-4" /> Start</>}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="card p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold">Senaste aktivitet</h2>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 5).map((item, index) => (
                  <div key={item.id || index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-background-darker flex items-center justify-center font-medium text-sm">
                      {item.user?.username?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.action}</div>
                      <div className="text-sm text-gray-400">av {item.user?.username || 'System'}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-8">Ingen aktivitet att visa.</p>
              )}
            </div>

            <Link to="/admin/logs" className="block w-full mt-4 text-center text-sm text-primary-400 hover:text-primary-300 transition-colors">
              Visa alla aktiviteter
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-display text-lg font-semibold mb-4">Snabbåtgärder</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/users" className="card-hover p-4 text-left block">
            <Users className="w-6 h-6 text-primary-400 mb-2" />
            <div className="font-medium">Hantera användare</div>
            <div className="text-sm text-gray-400">Visa och redigera användare</div>
          </Link>
          <Link to="/admin/tickets" className="card-hover p-4 text-left block">
            <Ticket className="w-6 h-6 text-yellow-400 mb-2" />
            <div className="font-medium">Öppna tickets</div>
            <div className="text-sm text-gray-400">{stats.openTickets} väntar på svar</div>
          </Link>
          <Link to="/admin/events" className="card-hover p-4 text-left block">
            <Calendar className="w-6 h-6 text-green-400 mb-2" />
            <div className="font-medium">Skapa event</div>
            <div className="text-sm text-gray-400">Planera en ny operation</div>
          </Link>
          <Link to="/admin/server" className="card-hover p-4 text-left block">
            <Server className="w-6 h-6 text-accent-400 mb-2" />
            <div className="font-medium">Serverinställningar</div>
            <div className="text-sm text-gray-400">Konfigurera servern</div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
