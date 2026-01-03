import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Server, Play, Square, RotateCcw, Terminal, Users, Cpu, HardDrive, Clock,
  Plus, Settings, Download, Wifi, Trash2, Send, Package, GripVertical,
  AlertCircle, CheckCircle, Loader2, Monitor, Globe, RefreshCw, Search,
  Star, ChevronLeft, ChevronRight, ExternalLink, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useServerStatus,
  useServerConnections,
  useAddServerConnection,
  useTestServerConnection,
  useDeleteServerConnection,
  useOnlinePlayers,
  useServerLogs,
  useLogDirs,
  useLogFiles,
  useLogFileContent,
  useStartServer,
  useStopServer,
  useRestartServer,
  useInstallServer,
  useSendCommand,
  useKickPlayer,
  useServerMods,
  useAddMod,
  useUpdateMod,
  useDeleteMod,
  useReorderMods,
  useServerConfig,
  useUpdateServerConfig,
  useWorkshopSearch,
  useServerVersion,
  useSteamProfile,
  formatUptime,
  ServerConnection,
  InstallProgress,
  Mod,
  ServerConfig,
  ServerLog,
  WorkshopMod,
} from '@/hooks/useServer';

// Admin SteamID Item Component
function AdminSteamIdItem({ steamId, onRemove }: { steamId: string; onRemove: () => void }) {
  const { data: profile, isLoading } = useSteamProfile(steamId);

  return (
    <div className="flex items-center gap-3 p-3 bg-background-darker rounded-lg border border-gray-700">
      {isLoading ? (
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      ) : profile ? (
        <>
          <img src={profile.avatar} alt={profile.personaName} className="w-8 h-8 rounded" />
          <div className="flex-1">
            <p className="font-medium">{profile.personaName}</p>
            <p className="text-xs text-gray-500">{steamId}</p>
          </div>
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary-light"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </>
      ) : (
        <div className="flex-1">
          <p className="font-medium text-gray-400">Steam-profil kunde inte hittas</p>
          <p className="text-xs text-gray-500">{steamId}</p>
        </div>
      )}
      <button
        onClick={onRemove}
        className="text-red-400 hover:text-red-300"
        type="button"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AdminServer() {
  const [activeTab, setActiveTab] = useState<'status' | 'settings' | 'mods' | 'connections' | 'console' | 'logs'>('status');
  const [selectedLogDir, setSelectedLogDir] = useState<string>('');
  const [selectedLogFile, setSelectedLogFile] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<string | undefined>();
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [showAddMod, setShowAddMod] = useState(false);
  const [installProgress, setInstallProgress] = useState<InstallProgress | null>(null);
  const [consoleInput, setConsoleInput] = useState('');
  const [_socket, setSocket] = useState<Socket | null>(null); // Kept for cleanup reference
  const [newAdminSteamId, setNewAdminSteamId] = useState('');

  // Server config state
  const [configForm, setConfigForm] = useState<ServerConfig>({
    name: 'Sweden Vikings Server',
    password: '',
    adminPassword: '',
    admins: [],
    maxPlayers: 64,
    visible: true,
    crossPlatform: false,
    supportedPlatforms: [],
    scenarioId: '{ECC61978EDCC2B5A}Missions/23_Campaign.conf',
    bindAddress: '0.0.0.0',
    bindPort: 2001,
    publicAddress: '',
    publicPort: 2001,
    a2sQueryEnabled: true,
    steamQueryPort: 17777,
    steamQueryAddress: '',
    rconEnabled: false,
    rconAddress: '',
    rconPort: 19999,
    rconPassword: '',
    rconPermission: 'monitor',
    rconMaxClients: 16,
    rconBlacklist: [],
    rconWhitelist: [],
    battlEye: true,
    disableThirdPerson: false,
    fastValidation: true,
    serverMaxViewDistance: 2500,
    serverMinGrassDistance: 50,
    networkViewDistance: 1000,
    lobbyPlayerSynchronise: false,
    aiLimit: -1,
    playerSaveTime: 120,
    vonDisableUI: false,
    vonDisableDirectSpeechUI: false,
    missionHeader: {},
  });

  // Queries
  const { data: serverStatus, refetch: refetchStatus } = useServerStatus(selectedConnection);
  const { data: connections = [], isLoading: connectionsLoading } = useServerConnections();
  const { data: players = [] } = useOnlinePlayers(selectedConnection);
  const { data: consoleLogs = [], refetch: refetchLogs } = useServerLogs(200, selectedConnection);
  const { data: mods = [], isLoading: modsLoading } = useServerMods();
  const { data: serverConfig, isLoading: configLoading, refetch: refetchConfig } = useServerConfig(selectedConnection);
  
  // Logs queries
  const { data: logDirs = [] } = useLogDirs(selectedConnection);
  const { data: logFiles = [] } = useLogFiles(selectedLogDir, selectedConnection);
  const { data: logFileContent } = useLogFileContent(selectedLogDir, selectedLogFile, 1000, selectedConnection);

  // Mutations
  const startServer = useStartServer();
  const stopServer = useStopServer();
  const restartServer = useRestartServer();
  const installServer = useInstallServer();
  const sendCommand = useSendCommand();
  const kickPlayer = useKickPlayer();
  const addConnection = useAddServerConnection();
  const testConnection = useTestServerConnection();
  const deleteConnection = useDeleteServerConnection();
  const addMod = useAddMod();
  const updateMod = useUpdateMod();
  const deleteMod = useDeleteMod();
  const reorderMods = useReorderMods();
  const updateServerConfig = useUpdateServerConfig();

  // Server version for mod compatibility check
  const { data: serverVersionData } = useServerVersion(selectedConnection);
  const serverGameVersion = serverVersionData?.version || '';

  // DnD sensors for mod reordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle mod drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = mods.findIndex((m) => m.id === active.id);
      const newIndex = mods.findIndex((m) => m.id === over.id);

      const newOrder = arrayMove(mods, oldIndex, newIndex).map((m) => m.id);
      reorderMods.mutate(newOrder, {
        onSuccess: () => toast.success('Mod-ordning uppdaterad'),
        onError: () => toast.error('Kunde inte uppdatera ordning'),
      });
    }
  };

  // Check if mod is compatible with server version
  const isModCompatible = (mod: Mod): { compatible: boolean; message?: string } => {
    if (!mod.gameVersion || !serverGameVersion) {
      return { compatible: true };
    }

    const modParts = mod.gameVersion.split('.').map(Number);
    const serverParts = serverGameVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(modParts.length, serverParts.length); i++) {
      const modPart = modParts[i] || 0;
      const serverPart = serverParts[i] || 0;

      if (modPart > serverPart) {
        return {
          compatible: false,
          message: `Kräver spelversion ${mod.gameVersion} (server har ${serverGameVersion})`
        };
      }
      if (modPart < serverPart) break;
    }

    return { compatible: true };
  };

  // Load config when selected connection changes
  useEffect(() => {
    if (serverConfig) {
      setConfigForm(serverConfig);
    }
  }, [serverConfig]);

  // Socket connection for real-time updates
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      newSocket.emit('join:server');
    });

    newSocket.on('server:status', () => {
      refetchStatus();
    });

    newSocket.on('server:install-progress', (progress: InstallProgress) => {
      setInstallProgress(progress);
      if (progress.status === 'complete' || progress.status === 'error') {
        setTimeout(() => setInstallProgress(null), 5000);
        refetchStatus();
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave:server');
      newSocket.disconnect();
    };
  }, []);

  // Set default connection
  useEffect(() => {
    if (connections.length > 0 && !selectedConnection) {
      const defaultConn = connections.find(c => c.isDefault) || connections[0];
      setSelectedConnection(defaultConn.id);
    }
  }, [connections, selectedConnection]);

  const handleStart = async () => {
    try {
      await startServer.mutateAsync(selectedConnection);
      toast.success('Server startar...');
    } catch (error: any) {
      const message = error.response?.data?.error?.message 
        || error.response?.data?.message 
        || 'Kunde inte starta servern';
      toast.error(message);
    }
  };

  const handleStop = async () => {
    try {
      await stopServer.mutateAsync(selectedConnection);
      toast.success('Server stoppar...');
    } catch (error: any) {
      const message = error.response?.data?.error?.message 
        || error.response?.data?.message 
        || 'Kunde inte stoppa servern';
      toast.error(message);
    }
  };

  const handleRestart = async () => {
    try {
      await restartServer.mutateAsync(selectedConnection);
      toast.success('Server startar om...');
    } catch (error: any) {
      const message = error.response?.data?.error?.message 
        || error.response?.data?.message 
        || 'Kunde inte starta om servern';
      toast.error(message);
    }
  };

  const handleInstall = async () => {
    try {
      await installServer.mutateAsync(selectedConnection);
      toast.success('Installation påbörjad...');
    } catch (error: any) {
      const message = error.response?.data?.error?.message 
        || error.response?.data?.message 
        || 'Kunde inte starta installation';
      toast.error(message);
    }
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim()) return;

    try {
      await sendCommand.mutateAsync({ 
        command: consoleInput, 
        connectionId: selectedConnection 
      });
      toast.success('Kommando skickat');
      setConsoleInput('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kunde inte skicka kommando');
    }
  };

  const handleKick = async (steamId: string, name: string) => {
    if (!confirm(`Kicka spelare ${name}?`)) return;
    
    try {
      await kickPlayer.mutateAsync({ steamId, connectionId: selectedConnection });
      toast.success(`${name} har kickats`);
    } catch (error: any) {
      toast.error('Kunde inte kicka spelare');
    }
  };

  const handleToggleMod = async (mod: Mod) => {
    try {
      await updateMod.mutateAsync({ modId: mod.id, enabled: !mod.enabled });
      toast.success(`${mod.name} ${mod.enabled ? 'inaktiverad' : 'aktiverad'}`);
    } catch (error: any) {
      toast.error('Kunde inte uppdatera mod');
    }
  };

  const handleDeleteMod = async (mod: Mod) => {
    if (!confirm(`Ta bort ${mod.name}?`)) return;
    try {
      await deleteMod.mutateAsync(mod.id);
      toast.success('Mod borttagen');
    } catch (error: any) {
      toast.error('Kunde inte ta bort mod');
    }
  };

  // No connections configured - show setup wizard
  if (!connectionsLoading && connections.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Server</h1>
          <p className="text-gray-400">Konfigurera din spelserver</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 text-center"
        >
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Server className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Ingen server konfigurerad</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Lägg till en serveranslutning för att börja hantera din Arma Reforger server.
            Du kan köra servern lokalt eller på en fjärrmaskin via SSH.
          </p>
          <button 
            onClick={() => setShowAddConnection(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            Lägg till server
          </button>
        </motion.div>

        <AddConnectionModal
          isOpen={showAddConnection}
          onClose={() => setShowAddConnection(false)}
          onAdd={addConnection}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Server</h1>
          <p className="text-gray-400">Hantera spelservern</p>
        </div>

        {connections.length > 1 && (
          <select
            value={selectedConnection || ''}
            onChange={(e) => setSelectedConnection(e.target.value)}
            className="input w-64"
          >
            {connections.map(conn => (
              <option key={conn.id} value={conn.id}>
                {conn.name} ({conn.type === 'local' ? 'Lokal' : conn.host})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'status' 
              ? 'bg-primary text-white' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Server className="w-4 h-4 inline mr-2" />
          Status
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'settings' 
              ? 'bg-primary text-white' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Inställningar
        </button>
        <button
          onClick={() => setActiveTab('mods')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'mods' 
              ? 'bg-primary text-white' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Mods ({mods.length})
        </button>
        <button
          onClick={() => setActiveTab('connections')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'connections' 
              ? 'bg-primary text-white' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-2" />
          Anslutningar
        </button>
        <button
          onClick={() => setActiveTab('console')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'console' 
              ? 'bg-primary text-white' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Terminal className="w-4 h-4 inline mr-2" />
          Konsol
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'logs' 
              ? 'bg-primary text-white' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <HardDrive className="w-4 h-4 inline mr-2" />
          Loggfiler
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'status' && (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Install Progress */}
            {installProgress && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="card overflow-hidden"
              >
                {/* Progress Header */}
                <div className={`px-4 py-3 ${
                  installProgress.status === 'error' 
                    ? 'bg-red-500/20 border-b border-red-500/30' 
                    : installProgress.status === 'complete' 
                    ? 'bg-green-500/20 border-b border-green-500/30'
                    : 'bg-primary/20 border-b border-primary/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {installProgress.status === 'error' ? (
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    ) : installProgress.status === 'complete' ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {installProgress.status === 'error' 
                          ? 'Installation misslyckades' 
                          : installProgress.status === 'complete'
                          ? 'Installation klar!'
                          : 'Installerar server...'}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {installProgress.status === 'downloading' && 'Laddar ner serverfiler från Steam'}
                        {installProgress.status === 'extracting' && 'Extraherar filer'}
                        {installProgress.status === 'configuring' && 'Konfigurerar server'}
                        {installProgress.status === 'complete' && 'Servern är redo att användas'}
                        {installProgress.status === 'error' && 'Ett fel uppstod under installationen'}
                      </p>
                    </div>
                    <span className={`text-2xl font-bold ${
                      installProgress.status === 'error' 
                        ? 'text-red-400' 
                        : installProgress.status === 'complete' 
                        ? 'text-green-400'
                        : 'text-primary'
                    }`}>
                      {installProgress.progress}%
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="relative">
                  <div className="h-3 bg-background-darker">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${installProgress.progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className={`h-full relative overflow-hidden ${
                        installProgress.status === 'error' 
                          ? 'bg-red-500' 
                          : installProgress.status === 'complete' 
                          ? 'bg-green-500'
                          : 'bg-gradient-to-r from-primary to-blue-500'
                      }`}
                    >
                      {/* Animated shimmer effect during download */}
                      {installProgress.status !== 'error' && installProgress.status !== 'complete' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      )}
                    </motion.div>
                  </div>
                </div>
                
                {/* Status Message */}
                <div className="px-4 py-3 bg-background-darker/50">
                  <div className="flex items-center gap-2 text-sm">
                    {installProgress.status !== 'error' && installProgress.status !== 'complete' && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                    <span className={
                      installProgress.status === 'error' 
                        ? 'text-red-400' 
                        : installProgress.status === 'complete' 
                        ? 'text-green-400'
                        : 'text-gray-300'
                    }>
                      {installProgress.message}
                    </span>
                  </div>
                  
                  {/* Installation Steps */}
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <InstallStep 
                      label="SteamCMD" 
                      completed={installProgress.progress >= 40} 
                      active={installProgress.progress < 40 && installProgress.status !== 'error'}
                    />
                    <div className="w-8 h-px bg-gray-700" />
                    <InstallStep 
                      label="Nedladdning" 
                      completed={installProgress.progress >= 95} 
                      active={installProgress.progress >= 40 && installProgress.progress < 95 && installProgress.status !== 'error'}
                    />
                    <div className="w-8 h-px bg-gray-700" />
                    <InstallStep 
                      label="Validering" 
                      completed={installProgress.progress >= 99} 
                      active={installProgress.progress >= 95 && installProgress.progress < 99 && installProgress.status !== 'error'}
                    />
                    <div className="w-8 h-px bg-gray-700" />
                    <InstallStep 
                      label="Klar" 
                      completed={installProgress.status === 'complete'} 
                      active={installProgress.progress >= 99 && installProgress.status !== 'complete' && installProgress.status !== 'error'}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Server Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    serverStatus?.isOnline ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <Server className={`w-8 h-8 ${
                      serverStatus?.isOnline ? 'text-green-400' : 'text-red-400'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold">
                        {serverStatus?.serverName || 'Arma Reforger Server'}
                      </h2>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        serverStatus?.isOnline 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {serverStatus?.isOnline ? 'Online' : 'Offline'}
                      </span>
                      {!serverStatus?.isInstalled && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                          Ej installerad
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400">
                      {serverStatus?.version && `Version ${serverStatus.version} • `}
                      {serverStatus?.map || 'Ingen karta'} • {serverStatus?.mission || 'Ingen mission'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {!serverStatus?.isInstalled ? (
                    <button 
                      onClick={handleInstall}
                      disabled={installServer.isPending || !!installProgress}
                      className="btn-primary"
                    >
                      {installServer.isPending || installProgress ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Download className="w-5 h-5" />
                      )}
                      Installera Server
                    </button>
                  ) : serverStatus?.isOnline ? (
                    <>
                      <button 
                        onClick={handleRestart}
                        disabled={restartServer.isPending}
                        className="btn-secondary"
                      >
                        {restartServer.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-5 h-5" />
                        )}
                        Restart
                      </button>
                      <button 
                        onClick={handleStop}
                        disabled={stopServer.isPending}
                        className="btn-danger"
                      >
                        {stopServer.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                        Stoppa
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={handleInstall}
                        disabled={installServer.isPending || !!installProgress}
                        className="btn-secondary"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Uppdatera
                      </button>
                      <button 
                        onClick={handleStart}
                        disabled={startServer.isPending}
                        className="btn-primary"
                      >
                        {startServer.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                        Starta
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 bg-background-darker rounded-xl">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Users className="w-4 h-4" />
                    Spelare
                  </div>
                  <div className="text-2xl font-bold">
                    {serverStatus?.players || 0}/{serverStatus?.maxPlayers || 64}
                  </div>
                </div>
                <div className="p-4 bg-background-darker rounded-xl">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Cpu className="w-4 h-4" />
                    CPU
                  </div>
                  <div className="text-2xl font-bold">
                    {serverStatus?.cpu?.toFixed(1) || 0}%
                  </div>
                </div>
                <div className="p-4 bg-background-darker rounded-xl">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <HardDrive className="w-4 h-4" />
                    Minne
                  </div>
                  <div className="text-2xl font-bold">
                    {serverStatus?.memory?.toFixed(1) || 0}%
                  </div>
                </div>
                <div className="p-4 bg-background-darker rounded-xl">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Clock className="w-4 h-4" />
                    Uptime
                  </div>
                  <div className="text-2xl font-bold">
                    {formatUptime(serverStatus?.uptime || 0)}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Online Players */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold">
                  Online Spelare ({players.length})
                </h2>
              </div>

              {players.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Inga spelare online just nu
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Spelare</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Player ID</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Anslöt</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-400">Ping</th>
                        <th className="text-right py-3 text-sm font-medium text-gray-400">Åtgärder</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {players.map((player) => (
                        <tr key={player.steamId || player.name} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 font-medium">{player.name}</td>
                          <td className="py-3 text-gray-400 font-mono text-sm">
                            {player.steamId || 'N/A'}
                          </td>
                          <td className="py-3 text-gray-400">
                            {new Date(player.joinedAt).toLocaleTimeString('sv-SE', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>
                          <td className="py-3">
                            <span className={`${
                              player.ping > 100 ? 'text-red-400' : 
                              player.ping > 50 ? 'text-yellow-400' : 
                              'text-green-400'
                            }`}>
                              {player.ping}ms
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button 
                              onClick={() => handleKick(player.steamId || '', player.name)}
                              disabled={!player.steamId}
                              className="btn-danger text-xs px-3 py-1"
                            >
                              Kick
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </motion.div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <p className="text-gray-400">
                Konfigurera serverinställningar för Arma Reforger.
              </p>
              <button 
                onClick={async () => {
                  try {
                    await updateServerConfig.mutateAsync({ connectionId: selectedConnection, config: configForm });
                    toast.success('Serverinställningar sparade!');
                    refetchConfig();
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Kunde inte spara inställningar');
                  }
                }}
                disabled={updateServerConfig.isPending || !selectedConnection}
                className="btn-primary"
              >
                {updateServerConfig.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                Spara inställningar
              </button>
            </div>

            {configLoading ? (
              <div className="card p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-gray-400 mt-2">Laddar serverinställningar...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Settings */}
                <div className="card p-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" />
                    Grundinställningar
                  </h3>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Servernamn</label>
                    <input
                      type="text"
                      value={configForm.name}
                      onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                      className="input w-full"
                      placeholder="Sweden Vikings Server"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Lösenord (lämna tomt för öppen server)</label>
                    <input
                      type="password"
                      value={configForm.password}
                      onChange={(e) => setConfigForm({ ...configForm, password: e.target.value })}
                      className="input w-full"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Admin Lösenord</label>
                    <input
                      type="password"
                      value={configForm.adminPassword}
                      onChange={(e) => setConfigForm({ ...configForm, adminPassword: e.target.value })}
                      className="input w-full"
                      placeholder="••••••••"
                    />
                  </div>

                  {/* Admin SteamIDs */}
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-2">Server Admins (SteamID64)</label>
                    <div className="space-y-2">
                      {configForm.admins && configForm.admins.length > 0 ? (
                        configForm.admins.map((steamId, index) => (
                          <AdminSteamIdItem
                            key={index}
                            steamId={steamId}
                            onRemove={() => {
                              const newAdmins = [...(configForm.admins || [])];
                              newAdmins.splice(index, 1);
                              setConfigForm({ ...configForm, admins: newAdmins });
                            }}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">Inga admins tillagda</p>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAdminSteamId}
                          onChange={(e) => setNewAdminSteamId(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newAdminSteamId.trim()) {
                              e.preventDefault();
                              if (newAdminSteamId.length === 17 && /^\d+$/.test(newAdminSteamId)) {
                                const admins = configForm.admins || [];
                                if (!admins.includes(newAdminSteamId)) {
                                  setConfigForm({ ...configForm, admins: [...admins, newAdminSteamId] });
                                  setNewAdminSteamId('');
                                } else {
                                  toast.error('Denna SteamID finns redan som admin');
                                }
                              } else {
                                toast.error('SteamID64 måste vara 17 siffror');
                              }
                            }
                          }}
                          placeholder="76561199176944069"
                          className="input flex-1"
                        />
                        <button
                          onClick={() => {
                            if (newAdminSteamId.trim()) {
                              if (newAdminSteamId.length === 17 && /^\d+$/.test(newAdminSteamId)) {
                                const admins = configForm.admins || [];
                                if (!admins.includes(newAdminSteamId)) {
                                  setConfigForm({ ...configForm, admins: [...admins, newAdminSteamId] });
                                  setNewAdminSteamId('');
                                } else {
                                  toast.error('Denna SteamID finns redan som admin');
                                }
                              } else {
                                toast.error('SteamID64 måste vara 17 siffror');
                              }
                            }
                          }}
                          className="btn-secondary flex items-center gap-2"
                          type="button"
                        >
                          <Plus className="w-4 h-4" />
                          Lägg till Admin
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        SteamID64 är 17 siffror långt (t.ex. 76561199176944069)
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max Spelare</label>
                    <input
                      type="number"
                      value={configForm.maxPlayers}
                      onChange={(e) => setConfigForm({ ...configForm, maxPlayers: parseInt(e.target.value) || 64 })}
                      className="input w-full"
                      min={1}
                      max={128}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Scenario ID</label>
                    <input
                      type="text"
                      value={configForm.scenarioId}
                      onChange={(e) => setConfigForm({ ...configForm, scenarioId: e.target.value })}
                      className="input w-full"
                      placeholder="{ECC61978EDCC2B5A}Missions/23_Campaign.conf"
                    />
                    <p className="text-xs text-gray-500 mt-1">Hitta scenario ID i spelets Mission Editor</p>
                  </div>
                </div>

                {/* Network Settings */}
                <div className="card p-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Nätverksinställningar
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Bind Address</label>
                      <input
                        type="text"
                        value={configForm.bindAddress || ''}
                        onChange={(e) => setConfigForm({ ...configForm, bindAddress: e.target.value })}
                        className="input w-full"
                        placeholder="0.0.0.0 (alla)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Bind Port</label>
                      <input
                        type="number"
                        value={configForm.bindPort}
                        onChange={(e) => setConfigForm({ ...configForm, bindPort: parseInt(e.target.value) || 2001 })}
                        className="input w-full"
                        min={1}
                        max={65535}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Public Address (extern IP)</label>
                      <input
                        type="text"
                        value={configForm.publicAddress || ''}
                        onChange={(e) => setConfigForm({ ...configForm, publicAddress: e.target.value })}
                        className="input w-full"
                        placeholder="Din publika IP-adress"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Public Port</label>
                      <input
                        type="number"
                        value={configForm.publicPort || configForm.bindPort}
                        onChange={(e) => setConfigForm({ ...configForm, publicPort: parseInt(e.target.value) || 2001 })}
                        className="input w-full"
                        min={1}
                        max={65535}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">A2S Query Adress</label>
                    <input
                      type="text"
                      value={configForm.steamQueryAddress || ''}
                      onChange={(e) => setConfigForm({ ...configForm, steamQueryAddress: e.target.value })}
                      placeholder="192.168.31.204"
                      className="input w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">IP-adress för Steam server query (A2S protokollet)</p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">A2S Query Port</label>
                    <input
                      type="number"
                      value={configForm.steamQueryPort}
                      onChange={(e) => setConfigForm({ ...configForm, steamQueryPort: parseInt(e.target.value) || 17777 })}
                      className="input w-full"
                      min={1}
                      max={65535}
                    />
                    <p className="text-xs text-gray-500 mt-1">Port för Steam server query (standard: 17777)</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="a2sQuery"
                      checked={configForm.a2sQueryEnabled}
                      onChange={(e) => setConfigForm({ ...configForm, a2sQueryEnabled: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                    />
                    <label htmlFor="a2sQuery" className="text-sm">Aktivera A2S Query (Steam server browser)</label>
                  </div>
                </div>

                {/* RCON Settings */}
                <div className="card p-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    RCON (Fjärrkonsol)
                  </h3>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="rconEnabled"
                      checked={configForm.rconEnabled || false}
                      onChange={(e) => setConfigForm({ ...configForm, rconEnabled: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                    />
                    <label htmlFor="rconEnabled" className="text-sm">Aktivera RCON</label>
                  </div>

                  {configForm.rconEnabled && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          RCON Adress
                          <span className="text-xs text-gray-500 ml-2">(IP-adress som RCON binder till)</span>
                        </label>
                        <input
                          type="text"
                          value={configForm.rconAddress || ''}
                          onChange={(e) => setConfigForm({ ...configForm, rconAddress: e.target.value })}
                          className="input w-full"
                          placeholder="t.ex. 192.168.1.100 (lämna tomt för alla gränssnitt)"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">RCON Port</label>
                        <input
                          type="number"
                          value={configForm.rconPort || 19999}
                          onChange={(e) => setConfigForm({ ...configForm, rconPort: parseInt(e.target.value) || 19999 })}
                          className="input w-full"
                          min={1}
                          max={65535}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          RCON Lösenord
                          <span className="text-xs text-red-400 ml-2">(minst 3 tecken, inga mellanslag)</span>
                        </label>
                        <input
                          type="password"
                          value={configForm.rconPassword || ''}
                          onChange={(e) => setConfigForm({ ...configForm, rconPassword: e.target.value })}
                          className="input w-full"
                          placeholder="Ange RCON lösenord"
                          minLength={3}
                          pattern="[^\s]+"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Behörighetsnivå</label>
                        <select
                          value={configForm.rconPermission || 'monitor'}
                          onChange={(e) => setConfigForm({ ...configForm, rconPermission: e.target.value as 'admin' | 'monitor' })}
                          className="input w-full"
                        >
                          <option value="monitor">Monitor (Endast läskommandon)</option>
                          <option value="admin">Admin (Alla kommandon)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Max antal klienter
                          <span className="text-xs text-gray-500 ml-2">(1-16, standard: 16)</span>
                        </label>
                        <input
                          type="number"
                          value={configForm.rconMaxClients || 16}
                          onChange={(e) => setConfigForm({ ...configForm, rconMaxClients: parseInt(e.target.value) || 16 })}
                          className="input w-full"
                          min={1}
                          max={16}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Blacklist
                          <span className="text-xs text-gray-500 ml-2">(Kommandon som är förbjudna, separera med komma)</span>
                        </label>
                        <input
                          type="text"
                          value={(configForm.rconBlacklist || []).join(', ')}
                          onChange={(e) => setConfigForm({ ...configForm, rconBlacklist: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          className="input w-full"
                          placeholder="t.ex. shutdown, kick"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">
                          Whitelist
                          <span className="text-xs text-gray-500 ml-2">(Om angiven, endast dessa kommandon tillåts)</span>
                        </label>
                        <input
                          type="text"
                          value={(configForm.rconWhitelist || []).join(', ')}
                          onChange={(e) => setConfigForm({ ...configForm, rconWhitelist: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          className="input w-full"
                          placeholder="t.ex. status, players"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Visibility & Platform */}
                <div className="card p-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Synlighet & Plattformar
                  </h3>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="visible"
                      checked={configForm.visible}
                      onChange={(e) => setConfigForm({ ...configForm, visible: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                    />
                    <label htmlFor="visible" className="text-sm">Visa i serverbrowser</label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="crossPlatform"
                      checked={configForm.crossPlatform}
                      onChange={(e) => setConfigForm({ ...configForm, crossPlatform: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                    />
                    <label htmlFor="crossPlatform" className="text-sm">Cross-platform (PC + Xbox)</label>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Plattformar</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={configForm.supportedPlatforms?.includes('PLATFORM_PC')}
                          onChange={(e) => {
                            const platforms = [...(configForm.supportedPlatforms || [])];
                            if (e.target.checked) {
                              platforms.push('PLATFORM_PC');
                            } else {
                              const idx = platforms.indexOf('PLATFORM_PC');
                              if (idx > -1) platforms.splice(idx, 1);
                            }
                            setConfigForm({ ...configForm, supportedPlatforms: platforms });
                          }}
                          className="w-4 h-4 rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                        />
                        <span className="text-sm">PC</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={configForm.supportedPlatforms?.includes('PLATFORM_XBL')}
                          onChange={(e) => {
                            const platforms = [...(configForm.supportedPlatforms || [])];
                            if (e.target.checked) {
                              platforms.push('PLATFORM_XBL');
                            } else {
                              const idx = platforms.indexOf('PLATFORM_XBL');
                              if (idx > -1) platforms.splice(idx, 1);
                            }
                            setConfigForm({ ...configForm, supportedPlatforms: platforms });
                          }}
                          className="w-4 h-4 rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                        />
                        <span className="text-sm">Xbox</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={configForm.supportedPlatforms?.includes('PLATFORM_PSN')}
                          onChange={(e) => {
                            const platforms = [...(configForm.supportedPlatforms || [])];
                            if (e.target.checked) {
                              platforms.push('PLATFORM_PSN');
                            } else {
                              const idx = platforms.indexOf('PLATFORM_PSN');
                              if (idx > -1) platforms.splice(idx, 1);
                            }
                            setConfigForm({ ...configForm, supportedPlatforms: platforms });
                          }}
                          className="w-4 h-4 rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                        />
                        <span className="text-sm">PlayStation</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Game Settings */}
                <div className="card p-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Spelinställningar
                  </h3>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="battlEye"
                      checked={configForm.battlEye}
                      onChange={(e) => setConfigForm({ ...configForm, battlEye: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                    />
                    <label htmlFor="battlEye" className="text-sm">BattlEye Anti-Cheat</label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="disableThirdPerson"
                      checked={configForm.disableThirdPerson}
                      onChange={(e) => setConfigForm({ ...configForm, disableThirdPerson: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                    />
                    <label htmlFor="disableThirdPerson" className="text-sm">Inaktivera 3:e person</label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="fastValidation"
                      checked={configForm.fastValidation}
                      onChange={(e) => setConfigForm({ ...configForm, fastValidation: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                    />
                    <label htmlFor="fastValidation" className="text-sm">Snabb validering (rekommenderas)</label>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Max View Distance</label>
                    <input
                      type="number"
                      value={configForm.serverMaxViewDistance}
                      onChange={(e) => setConfigForm({ ...configForm, serverMaxViewDistance: parseInt(e.target.value) || 2500 })}
                      className="input w-full"
                      min={500}
                      max={10000}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Min Grass Distance</label>
                    <input
                      type="number"
                      value={configForm.serverMinGrassDistance}
                      onChange={(e) => setConfigForm({ ...configForm, serverMinGrassDistance: parseInt(e.target.value) || 50 })}
                      className="input w-full"
                      min={0}
                      max={200}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Network View Distance</label>
                    <input
                      type="number"
                      value={configForm.networkViewDistance}
                      onChange={(e) => setConfigForm({ ...configForm, networkViewDistance: parseInt(e.target.value) || 1000 })}
                      className="input w-full"
                      min={500}
                      max={5000}
                    />
                  </div>
                </div>

                {/* Operating Settings */}
                <div className="card p-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Server-inställningar
                  </h3>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="lobbyPlayerSynchronise"
                      checked={configForm.lobbyPlayerSynchronise}
                      onChange={(e) => setConfigForm({ ...configForm, lobbyPlayerSynchronise: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                    />
                    <label htmlFor="lobbyPlayerSynchronise" className="text-sm">Synkronisera spelare i lobby</label>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">AI Limit (-1 = obegränsat)</label>
                    <input
                      type="number"
                      value={configForm.aiLimit}
                      onChange={(e) => setConfigForm({ ...configForm, aiLimit: parseInt(e.target.value) })}
                      className="input w-full"
                      min={-1}
                      max={10000}
                    />
                    <p className="text-xs text-gray-500 mt-1">Max antal AI på servern. -1 betyder ingen gräns.</p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Player Save Time (sekunder)</label>
                    <input
                      type="number"
                      value={configForm.playerSaveTime || 120}
                      onChange={(e) => setConfigForm({ ...configForm, playerSaveTime: parseInt(e.target.value) || 120 })}
                      className="input w-full"
                      min={30}
                      max={600}
                    />
                    <p className="text-xs text-gray-500 mt-1">Hur ofta spelarprogress sparas (sekunder).</p>
                  </div>
                </div>

                {/* VON Settings */}
                <div className="card p-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    VON (Voice Over Network)
                  </h3>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="vonDisableUI"
                      checked={configForm.vonDisableUI}
                      onChange={(e) => setConfigForm({ ...configForm, vonDisableUI: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                    />
                    <label htmlFor="vonDisableUI" className="text-sm">Inaktivera VON UI</label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="vonDisableDirectSpeechUI"
                      checked={configForm.vonDisableDirectSpeechUI}
                      onChange={(e) => setConfigForm({ ...configForm, vonDisableDirectSpeechUI: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                    />
                    <label htmlFor="vonDisableDirectSpeechUI" className="text-sm">Inaktivera Direct Speech UI</label>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'mods' && (
          <motion.div
            key="mods"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <p className="text-gray-400">
                Hantera servermods. Dra för att ändra ordning. Mods från Arma Reforger Workshop.
              </p>
              <button
                onClick={() => setShowAddMod(true)}
                className="btn-primary"
              >
                <Plus className="w-5 h-5" />
                Lägg till mod
              </button>
            </div>

            {modsLoading ? (
              <div className="card p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-gray-400 mt-2">Laddar mods...</p>
              </div>
            ) : mods.length === 0 ? (
              <div className="card p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inga mods installerade</h3>
                <p className="text-gray-400 mb-4">
                  Lägg till mods från Arma Reforger Workshop för att förbättra spelupplevelsen.
                </p>
                <button
                  onClick={() => setShowAddMod(true)}
                  className="btn-primary"
                >
                  <Plus className="w-5 h-5" />
                  Lägg till din första mod
                </button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={mods.map(m => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {mods.map((mod) => {
                      const compatibility = isModCompatible(mod);
                      return (
                        <SortableModCard
                          key={mod.id}
                          mod={mod}
                          compatibility={compatibility}
                          onToggle={() => handleToggleMod(mod)}
                          onDelete={() => handleDeleteMod(mod)}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {mods.length > 0 && (
              <div className="card p-4 bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-200">
                      Ändringar i mods kräver omstart av servern för att träda i kraft.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'connections' && (
          <motion.div
            key="connections"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-end">
              <button 
                onClick={() => setShowAddConnection(true)}
                className="btn-primary"
              >
                <Plus className="w-5 h-5" />
                Lägg till anslutning
              </button>
            </div>

            <div className="grid gap-4">
              {connections.map((conn) => (
                <ConnectionCard
                  key={conn.id}
                  connection={conn}
                  isSelected={conn.id === selectedConnection}
                  onSelect={() => setSelectedConnection(conn.id)}
                  onTest={() => testConnection.mutateAsync(conn.id)}
                  onDelete={() => {
                    if (confirm('Ta bort denna anslutning?')) {
                      deleteConnection.mutate(conn.id);
                    }
                  }}
                  isTesting={testConnection.isPending}
                />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'console' && (
          <motion.div
            key="console"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-gray-400" />
                <h2 className="font-display text-lg font-semibold">Server Konsol (Live)</h2>
                {serverStatus?.isOnline && (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="rounded border-gray-600 bg-background-darker text-primary focus:ring-primary"
                  />
                  Auto-scroll
                </label>
                <button 
                  onClick={() => refetchLogs()}
                  className="btn-secondary btn-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <ConsoleOutput logs={consoleLogs} autoScroll={autoScroll} />

            <form onSubmit={handleSendCommand} className="flex gap-2 mt-4">
              <input
                type="text"
                value={consoleInput}
                onChange={(e) => setConsoleInput(e.target.value)}
                placeholder="Skriv RCON-kommando..."
                className="input flex-1 font-mono"
                disabled={!serverStatus?.isOnline}
              />
              <button 
                type="submit" 
                className="btn-primary"
                disabled={!serverStatus?.isOnline || !serverStatus?.rconEnabled === false || sendCommand.isPending}
              >
                {sendCommand.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
            {!serverStatus?.rconEnabled && serverStatus?.isOnline && (
              <p className="text-xs text-yellow-400 mt-2">
                ⚠️ RCON är inte aktiverat. Aktivera RCON i inställningarna för att kunna skicka kommandon.
              </p>
            )}
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="w-5 h-5 text-gray-400" />
              <h2 className="font-display text-lg font-semibold">Loggfiler</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Log Directory List */}
              <div className="lg:col-span-1 space-y-2">
                <label className="block text-sm text-gray-400 mb-2">Loggmappar</label>
                <div className="bg-background-darker rounded-lg p-2 max-h-96 overflow-y-auto">
                  {logDirs.length === 0 ? (
                    <p className="text-gray-500 text-sm p-2">Inga loggmappar</p>
                  ) : (
                    logDirs.map((dir) => (
                      <button
                        key={dir}
                        onClick={() => {
                          setSelectedLogDir(dir);
                          setSelectedLogFile('');
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm font-mono truncate ${
                          selectedLogDir === dir 
                            ? 'bg-primary/20 text-primary' 
                            : 'text-gray-400 hover:bg-white/5'
                        }`}
                      >
                        {dir.replace('logs_', '📁 ')}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Log Files List */}
              <div className="lg:col-span-1 space-y-2">
                <label className="block text-sm text-gray-400 mb-2">Filer</label>
                <div className="bg-background-darker rounded-lg p-2 max-h-96 overflow-y-auto">
                  {!selectedLogDir ? (
                    <p className="text-gray-500 text-sm p-2">Välj en loggmapp</p>
                  ) : logFiles.length === 0 ? (
                    <p className="text-gray-500 text-sm p-2">Inga filer</p>
                  ) : (
                    logFiles.map((file) => (
                      <button
                        key={file}
                        onClick={() => setSelectedLogFile(file)}
                        className={`w-full text-left px-3 py-2 rounded text-sm truncate ${
                          selectedLogFile === file 
                            ? 'bg-primary/20 text-primary' 
                            : 'text-gray-400 hover:bg-white/5'
                        }`}
                      >
                        📄 {file}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Log Content */}
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-sm text-gray-400 mb-2">
                  Innehåll {selectedLogFile && `- ${selectedLogFile}`}
                </label>
                <div className="bg-background-darker rounded-lg p-4 h-96 overflow-auto font-mono text-xs">
                  {!selectedLogFile ? (
                    <p className="text-gray-500">Välj en fil för att se innehållet</p>
                  ) : !logFileContent?.content ? (
                    <p className="text-gray-500">Laddar...</p>
                  ) : (
                    <pre className="whitespace-pre-wrap text-gray-400">
                      {logFileContent.content.split('\n').map((line, i) => (
                        <div 
                          key={i}
                          className={`${
                            line.includes('(E)') || line.toLowerCase().includes('error') ? 'text-red-400' :
                            line.includes('(W)') || line.toLowerCase().includes('warning') ? 'text-yellow-400' :
                            line.includes('SCRIPT') ? 'text-blue-400' :
                            line.includes('BACKEND') ? 'text-purple-400' :
                            'text-gray-400'
                          }`}
                        >
                          {line}
                        </div>
                      ))}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddConnectionModal
        isOpen={showAddConnection}
        onClose={() => setShowAddConnection(false)}
        onAdd={addConnection}
      />

      <AddModModal
        isOpen={showAddMod}
        onClose={() => setShowAddMod(false)}
        onAdd={addMod}
      />
    </div>
  );
}

// ============================================
// Connection Card Component
// ============================================

// ============================================
// Console Output Component
// ============================================

interface ConsoleOutputProps {
  logs: ServerLog[];
  autoScroll: boolean;
}

function ConsoleOutput({ logs, autoScroll }: ConsoleOutputProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  return (
    <div 
      ref={containerRef}
      className="bg-black/50 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs border border-white/5"
    >
      {logs.length === 0 ? (
        <p className="text-gray-500">Väntar på loggar... Starta servern för att se output.</p>
      ) : (
        logs.map((log, i) => {
          const levelColor = 
            log.level === 'error' ? 'text-red-400' :
            log.level === 'warning' ? 'text-yellow-400' :
            log.level === 'debug' ? 'text-gray-600' :
            'text-gray-300';
          
          const categoryColor = 
            log.category === 'SCRIPT' ? 'text-blue-400' :
            log.category === 'BACKEND' ? 'text-purple-400' :
            log.category === 'NETWORK' ? 'text-cyan-400' :
            log.category === 'WORLD' ? 'text-green-400' :
            'text-gray-500';

          return (
            <div key={i} className={`leading-relaxed ${levelColor}`}>
              <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString('sv-SE')}]</span>
              {log.category && <span className={`mx-1 ${categoryColor}`}>[{log.category}]</span>}
              <span>{log.message}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

// ============================================
// Connection Card Component
// ============================================

interface ConnectionCardProps {
  connection: ServerConnection;
  isSelected: boolean;
  onSelect: () => void;
  onTest: () => Promise<any>;
  onDelete: () => void;
  isTesting: boolean;
}

function ConnectionCard({ connection, isSelected, onSelect, onTest, onDelete, isTesting }: ConnectionCardProps) {
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    try {
      const result = await onTest();
      setTestResult(result);
      setTimeout(() => setTestResult(null), 5000);
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card p-4 cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary' : 'hover:bg-white/5'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            connection.status === 'connected' ? 'bg-green-500/20' : 'bg-gray-500/20'
          }`}>
            {connection.type === 'local' ? (
              <Monitor className={`w-6 h-6 ${
                connection.status === 'connected' ? 'text-green-400' : 'text-gray-400'
              }`} />
            ) : (
              <Globe className={`w-6 h-6 ${
                connection.status === 'connected' ? 'text-green-400' : 'text-gray-400'
              }`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{connection.name}</h3>
              {connection.isDefault && (
                <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">
                  Standard
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {connection.type === 'local' ? 'Lokal server' : `${connection.host}:${connection.port}`}
              {' • '}
              {connection.platform === 'windows' ? 'Windows' : 'Linux'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Sökväg: {connection.serverPath}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {testResult && (
            <span className={`text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {testResult.message}
            </span>
          )}
          <button 
            onClick={handleTest}
            disabled={isTesting}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            {isTesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wifi className="w-4 h-4" />
            )}
            Testa
          </button>
          <button 
            onClick={onDelete}
            className="btn-danger text-sm px-3 py-1.5"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Add Connection Modal
// ============================================

interface AddConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: any;
}

function AddConnectionModal({ isOpen, onClose, onAdd }: AddConnectionModalProps) {
  const [type, setType] = useState<'local' | 'remote'>('local');
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 22,
    username: 'root',
    password: '',
    privateKey: '',
    serverPath: '/opt/arma-reforger',
    steamCmdPath: '/opt/steamcmd',
    platform: 'linux' as 'linux' | 'windows',
    isDefault: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await onAdd.mutateAsync({
        name: formData.name,
        type,
        host: type === 'remote' ? formData.host : undefined,
        port: type === 'remote' ? formData.port : undefined,
        username: type === 'remote' ? formData.username : undefined,
        password: type === 'remote' && formData.password ? formData.password : undefined,
        privateKey: type === 'remote' && formData.privateKey ? formData.privateKey : undefined,
        serverPath: formData.serverPath,
        steamCmdPath: formData.steamCmdPath,
        platform: formData.platform,
        isDefault: formData.isDefault,
      });
      toast.success('Anslutning tillagd!');
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kunde inte lägga till anslutning');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold mb-4">Lägg till serveranslutning</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Connection Type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('local')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                type === 'local' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <Monitor className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium">Lokal</p>
              <p className="text-xs text-gray-400">Samma maskin</p>
            </button>
            <button
              type="button"
              onClick={() => setType('remote')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                type === 'remote' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <Globe className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium">Fjärr (SSH)</p>
              <p className="text-xs text-gray-400">Annan maskin</p>
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Namn</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Min server"
              className="input w-full"
              required
            />
          </div>

          {/* Remote Settings */}
          {type === 'remote' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Host</label>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="192.168.1.100"
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Port</label>
                  <input
                    type="number"
                    value={formData.port}
                    onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Användarnamn</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Lösenord</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Lämna tomt för SSH-nyckel"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">SSH Privat Nyckel (valfri)</label>
                <textarea
                  value={formData.privateKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, privateKey: e.target.value }))}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----..."
                  className="input w-full h-24 font-mono text-xs"
                />
              </div>
            </>
          )}

          {/* Platform */}
          <div>
            <label className="block text-sm font-medium mb-1">Plattform</label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                platform: e.target.value as 'linux' | 'windows',
                serverPath: e.target.value === 'windows' ? 'C:\\arma-reforger' : '/opt/arma-reforger',
                steamCmdPath: e.target.value === 'windows' ? 'C:\\steamcmd' : '/opt/steamcmd',
              }))}
              className="input w-full"
            >
              <option value="linux">Linux</option>
              <option value="windows">Windows</option>
            </select>
          </div>

          {/* Paths */}
          <div>
            <label className="block text-sm font-medium mb-1">Server Sökväg</label>
            <input
              type="text"
              value={formData.serverPath}
              onChange={(e) => setFormData(prev => ({ ...prev, serverPath: e.target.value }))}
              className="input w-full font-mono text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">SteamCMD Sökväg</label>
            <input
              type="text"
              value={formData.steamCmdPath}
              onChange={(e) => setFormData(prev => ({ ...prev, steamCmdPath: e.target.value }))}
              className="input w-full font-mono text-sm"
            />
          </div>

          {/* Default */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
              className="w-4 h-4 rounded border-white/20 bg-background-darker text-primary focus:ring-primary"
            />
            <span className="text-sm">Ange som standardanslutning</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Avbryt
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={onAdd.isPending}
            >
              {onAdd.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              Lägg till
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ============================================
// Add Mod Modal
// ============================================

// Sortable Mod Card Component
interface SortableModCardProps {
  mod: Mod;
  compatibility: { compatible: boolean; message?: string };
  onToggle: () => void;
  onDelete: () => void;
}

function SortableModCard({ mod, compatibility, onToggle, onDelete }: SortableModCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mod.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card p-4 flex items-center gap-4 ${!mod.enabled ? 'opacity-60' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {mod.imageUrl ? (
        <img
          src={mod.imageUrl}
          alt={mod.name}
          className="w-16 h-16 rounded-lg object-cover"
        />
      ) : (
        <div className="w-16 h-16 bg-background-darker rounded-lg flex items-center justify-center">
          <Package className="w-8 h-8 text-gray-500" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{mod.name}</h3>
          <span className="text-xs text-gray-500 font-mono">#{mod.loadOrder + 1}</span>
          {mod.version && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
              v{mod.version}
            </span>
          )}
          {!compatibility.compatible && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Inkompatibel
            </span>
          )}
        </div>

        {mod.description && (
          <p className="text-sm text-gray-400 truncate">{mod.description}</p>
        )}

        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          {mod.author && <span>{mod.author}</span>}
          {mod.size && <span>• {(Number(mod.size) / 1024 / 1024).toFixed(1)} MB</span>}
          {mod.gameVersion && <span>• Spelversion {mod.gameVersion}</span>}
          {mod.rating !== undefined && mod.rating > 0 && (
            <span className="flex items-center gap-1">
              • <Star className="w-3 h-3 text-yellow-400" /> {mod.rating}%
            </span>
          )}
        </div>

        {!compatibility.compatible && compatibility.message && (
          <p className="text-xs text-red-400 mt-1">{compatibility.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            mod.enabled ? 'bg-green-500' : 'bg-gray-600'
          }`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            mod.enabled ? 'left-7' : 'left-1'
          }`} />
        </button>
        <a
          href={`https://reforger.armaplatform.com/workshop/${mod.workshopId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary p-2"
          title="Öppna i Arma Reforger Workshop"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <button
          onClick={onDelete}
          className="btn-danger p-2"
          title="Ta bort mod"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Add Mod Modal with Search
// ============================================

interface AddModModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: any;
}

// Installation Step Indicator Component
function InstallStep({ label, completed, active }: { label: string; completed: boolean; active: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${
      completed ? 'text-green-400' : active ? 'text-primary' : 'text-gray-500'
    }`}>
      {completed ? (
        <CheckCircle className="w-4 h-4" />
      ) : active ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <div className="w-4 h-4 rounded-full border border-current" />
      )}
      <span className={completed || active ? 'font-medium' : ''}>{label}</span>
    </div>
  );
}

function AddModModal({ isOpen, onClose, onAdd }: AddModModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [addingModId, setAddingModId] = useState<string | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading, isFetching } = useWorkshopSearch(debouncedQuery, page);

  const handleAddMod = async (mod: WorkshopMod) => {
    if (mod.isInstalled) {
      toast.error('Denna mod är redan installerad');
      return;
    }

    setAddingModId(mod.modId);
    try {
      const response = await onAdd.mutateAsync(mod.modId);

      // Check if dependencies were installed
      if (response?.data?.dependenciesInstalled && response.data.dependenciesInstalled.length > 0) {
        toast.success(
          `${mod.name} tillagd med ${response.data.dependenciesInstalled.length} beroende mod(s)!`,
          { duration: 5000 }
        );
      } else {
        toast.success(`${mod.name} tillagd!`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Kunde inte lägga till mod');
    } finally {
      setAddingModId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="card p-6 w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Lägg till mod</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök efter mods i Arma Reforger Workshop..."
            className="input w-full pl-10"
            autoFocus
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
          )}
        </div>

        {/* Search results */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {searchQuery.length < 2 ? (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Skriv minst 2 tecken för att söka</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-gray-400 mt-2">Söker...</p>
            </div>
          ) : !searchResults || searchResults.mods.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Inga mods hittades för "{searchQuery}"</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.mods.map((mod) => (
                <div
                  key={mod.modId}
                  className={`card p-3 flex items-center gap-3 ${
                    mod.isInstalled ? 'opacity-50' : 'hover:bg-background-lighter'
                  }`}
                >
                  {mod.imageUrl ? (
                    <img
                      src={mod.imageUrl}
                      alt={mod.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-background-darker rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-500" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{mod.name}</h3>
                      {mod.isInstalled && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                          Installerad
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{mod.author}</span>
                      <span>•</span>
                      <span>v{mod.version}</span>
                      <span>•</span>
                      <span>{(mod.size / 1024 / 1024).toFixed(1)} MB</span>
                      {mod.rating > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400" /> {mod.rating}%
                          </span>
                        </>
                      )}
                    </div>
                    {mod.gameVersion && (
                      <p className="text-xs text-gray-500">Spelversion: {mod.gameVersion}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddMod(mod)}
                    disabled={mod.isInstalled || addingModId === mod.modId}
                    className={`btn-primary p-2 ${mod.isInstalled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={mod.isInstalled ? 'Redan installerad' : 'Lägg till mod'}
                  >
                    {addingModId === mod.modId ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : mod.isInstalled ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {searchResults && searchResults.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary p-2 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-400">
              Sida {page} av {searchResults.totalPages} ({searchResults.total} mods)
            </span>
            <button
              onClick={() => setPage(p => Math.min(searchResults.totalPages, p + 1))}
              disabled={page === searchResults.totalPages}
              className="btn-secondary p-2 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
