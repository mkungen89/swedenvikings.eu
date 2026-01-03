import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  Search,
  Filter,
  Crosshair,
  Truck,
  Shield,
  Flag,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

type Faction = 'NATO' | 'RUS' | 'NEUTRAL';
type WeaponType = 'ASSAULT_RIFLE' | 'SNIPER_RIFLE' | 'MACHINE_GUN' | 'SUBMACHINE_GUN' | 'PISTOL' | 'SHOTGUN' | 'GRENADE_LAUNCHER' | 'ROCKET_LAUNCHER' | 'MELEE';
type VehicleType = 'TANK' | 'APC' | 'IFV' | 'TRUCK' | 'CAR' | 'HELICOPTER' | 'BOAT' | 'STATIC_WEAPON';

interface Weapon {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  type: WeaponType;
  faction: Faction;
  modSource: string;
  imageUrl?: string;
  iconUrl?: string;
  damage?: number;
  accuracy?: number;
  range?: number;
  fireRate?: number;
  isActive: boolean;
}

interface Vehicle {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  type: VehicleType;
  faction: Faction;
  modSource: string;
  imageUrl?: string;
  iconUrl?: string;
  armor?: number;
  speed?: number;
  capacity?: number;
  isActive: boolean;
}

export default function AdminBattlelog() {
  const [activeTab, setActiveTab] = useState<'weapons' | 'vehicles'>('weapons');
  const [searchQuery, setSearchQuery] = useState('');
  const [factionFilter, setFactionFilter] = useState<Faction | 'ALL'>('ALL');
  const [modFilter, setModFilter] = useState<string>('ALL');
  const [showWeaponModal, setShowWeaponModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingWeapon, setEditingWeapon] = useState<Weapon | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const queryClient = useQueryClient();

  // Fetch weapons
  const { data: weapons = [], isLoading: weaponsLoading } = useQuery({
    queryKey: ['weapons'],
    queryFn: async () => {
      const res = await axios.get('/api/battlelog/weapons');
      return res.data as Weapon[];
    },
  });

  // Fetch vehicles
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const res = await axios.get('/api/battlelog/vehicles');
      return res.data as Vehicle[];
    },
  });

  // Fetch mod sources
  const { data: modSources = [] } = useQuery({
    queryKey: ['modSources'],
    queryFn: async () => {
      const res = await axios.get('/api/battlelog/mods');
      return res.data as string[];
    },
  });

  // Delete weapon
  const deleteWeaponMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/battlelog/weapons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weapons'] });
    },
  });

  // Delete vehicle
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/battlelog/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const filteredWeapons = weapons.filter((weapon) => {
    const matchesSearch =
      weapon.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      weapon.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFaction = factionFilter === 'ALL' || weapon.faction === factionFilter;
    const matchesMod = modFilter === 'ALL' || weapon.modSource === modFilter;
    return matchesSearch && matchesFaction && matchesMod;
  });

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFaction = factionFilter === 'ALL' || vehicle.faction === factionFilter;
    const matchesMod = modFilter === 'ALL' || vehicle.modSource === modFilter;
    return matchesSearch && matchesFaction && matchesMod;
  });

  const getFactionColor = (faction: Faction) => {
    switch (faction) {
      case 'NATO':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'RUS':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'NEUTRAL':
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Battlelog Management</h1>
          <p className="text-gray-400">
            Hantera vapen och fordon från WCS, ACE, RHS och andra moddar
          </p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'weapons') {
              setEditingWeapon(null);
              setShowWeaponModal(true);
            } else {
              setEditingVehicle(null);
              setShowVehicleModal(true);
            }
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'weapons' ? 'Lägg till Vapen' : 'Lägg till Fordon'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex gap-1">
          <button
            onClick={() => setActiveTab('weapons')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'weapons'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            Vapen ({weapons.length})
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'vehicles'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Truck className="w-4 h-4" />
            Fordon ({vehicles.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Sök..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Faction Filter */}
          <select
            value={factionFilter}
            onChange={(e) => setFactionFilter(e.target.value as Faction | 'ALL')}
            className="input"
          >
            <option value="ALL">Alla Fraktioner</option>
            <option value="NATO">NATO</option>
            <option value="RUS">RUS</option>
            <option value="NEUTRAL">Neutral</option>
          </select>

          {/* Mod Filter */}
          <select
            value={modFilter}
            onChange={(e) => setModFilter(e.target.value)}
            className="input"
          >
            <option value="ALL">Alla Moddar</option>
            {modSources.map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'weapons' && (
        <WeaponsTable
          weapons={filteredWeapons}
          loading={weaponsLoading}
          onEdit={(weapon) => {
            setEditingWeapon(weapon);
            setShowWeaponModal(true);
          }}
          onDelete={(id) => {
            if (confirm('Är du säker på att du vill ta bort detta vapen?')) {
              deleteWeaponMutation.mutate(id);
            }
          }}
          getFactionColor={getFactionColor}
        />
      )}

      {activeTab === 'vehicles' && (
        <VehiclesTable
          vehicles={filteredVehicles}
          loading={vehiclesLoading}
          onEdit={(vehicle) => {
            setEditingVehicle(vehicle);
            setShowVehicleModal(true);
          }}
          onDelete={(id) => {
            if (confirm('Är du säker på att du vill ta bort detta fordon?')) {
              deleteVehicleMutation.mutate(id);
            }
          }}
          getFactionColor={getFactionColor}
        />
      )}

      {/* Modals */}
      <AnimatePresence>
        {showWeaponModal && (
          <WeaponModal
            weapon={editingWeapon}
            onClose={() => {
              setShowWeaponModal(false);
              setEditingWeapon(null);
            }}
          />
        )}

        {showVehicleModal && (
          <VehicleModal
            vehicle={editingVehicle}
            onClose={() => {
              setShowVehicleModal(false);
              setEditingVehicle(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Weapons Table Component
function WeaponsTable({
  weapons,
  loading,
  onEdit,
  onDelete,
  getFactionColor,
}: {
  weapons: Weapon[];
  loading: boolean;
  onEdit: (weapon: Weapon) => void;
  onDelete: (id: string) => void;
  getFactionColor: (faction: Faction) => string;
}) {
  if (loading) {
    return (
      <div className="card p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
        <p className="text-gray-400">Laddar vapen...</p>
      </div>
    );
  }

  if (weapons.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Crosshair className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Inga vapen hittades</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50 border-b border-white/10">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-sm">Bild</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Namn</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Typ</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Fraktion</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Mod</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
              <th className="text-right py-3 px-4 font-semibold text-sm">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {weapons.map((weapon) => (
              <tr key={weapon.id} className="hover:bg-white/5 transition-colors">
                <td className="py-3 px-4">
                  {weapon.imageUrl ? (
                    <img
                      src={weapon.imageUrl}
                      alt={weapon.displayName}
                      className="w-16 h-10 object-contain rounded bg-slate-800"
                    />
                  ) : (
                    <div className="w-16 h-10 rounded bg-slate-800 flex items-center justify-center">
                      <Crosshair className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div>
                    <div className="font-semibold">{weapon.displayName}</div>
                    <div className="text-xs text-gray-500">{weapon.name}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-400">
                    {weapon.type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${getFactionColor(
                      weapon.faction
                    )}`}
                  >
                    {weapon.faction}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-400">{weapon.modSource}</span>
                </td>
                <td className="py-3 px-4">
                  {weapon.isActive ? (
                    <span className="text-green-400 text-sm">Aktiv</span>
                  ) : (
                    <span className="text-gray-500 text-sm">Inaktiv</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(weapon)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-primary-400"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(weapon.id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Vehicles Table Component (similar to weapons)
function VehiclesTable({
  vehicles,
  loading,
  onEdit,
  onDelete,
  getFactionColor,
}: {
  vehicles: Vehicle[];
  loading: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  getFactionColor: (faction: Faction) => string;
}) {
  if (loading) {
    return (
      <div className="card p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-4" />
        <p className="text-gray-400">Laddar fordon...</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Truck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Inga fordon hittades</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50 border-b border-white/10">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-sm">Bild</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Namn</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Typ</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Fraktion</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Mod</th>
              <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
              <th className="text-right py-3 px-4 font-semibold text-sm">Åtgärder</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-white/5 transition-colors">
                <td className="py-3 px-4">
                  {vehicle.imageUrl ? (
                    <img
                      src={vehicle.imageUrl}
                      alt={vehicle.displayName}
                      className="w-16 h-10 object-contain rounded bg-slate-800"
                    />
                  ) : (
                    <div className="w-16 h-10 rounded bg-slate-800 flex items-center justify-center">
                      <Truck className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div>
                    <div className="font-semibold">{vehicle.displayName}</div>
                    <div className="text-xs text-gray-500">{vehicle.name}</div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-400">
                    {vehicle.type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${getFactionColor(
                      vehicle.faction
                    )}`}
                  >
                    {vehicle.faction}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-400">{vehicle.modSource}</span>
                </td>
                <td className="py-3 px-4">
                  {vehicle.isActive ? (
                    <span className="text-green-400 text-sm">Aktiv</span>
                  ) : (
                    <span className="text-gray-500 text-sm">Inaktiv</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(vehicle)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-primary-400"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(vehicle.id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Weapon Modal (Create/Edit)
function WeaponModal({ weapon, onClose }: { weapon: Weapon | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post('/api/battlelog/weapons', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weapons'] });
      queryClient.invalidateQueries({ queryKey: ['modSources'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await axios.put(`/api/battlelog/weapons/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weapons'] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get('name') as string,
      displayName: formData.get('displayName') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as WeaponType,
      faction: formData.get('faction') as Faction,
      modSource: formData.get('modSource') as string,
      imageUrl: formData.get('imageUrl') as string,
      iconUrl: formData.get('iconUrl') as string,
      isActive: formData.get('isActive') === 'true',
    };

    if (weapon) {
      updateMutation.mutate({ id: weapon.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleImageUpload = async (weaponId: string, file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      await axios.post(`/api/battlelog/weapons/${weaponId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      queryClient.invalidateQueries({ queryKey: ['weapons'] });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Bilduppladdning misslyckades');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">
              {weapon ? 'Redigera Vapen' : 'Lägg till Vapen'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name (ID)</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={weapon?.name}
                  required
                  className="input w-full"
                  placeholder="m4a1_carbine"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  name="displayName"
                  defaultValue={weapon?.displayName}
                  required
                  className="input w-full"
                  placeholder="M4A1 Carbine"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select name="type" defaultValue={weapon?.type} required className="input w-full">
                  <option value="ASSAULT_RIFLE">Assault Rifle</option>
                  <option value="SNIPER_RIFLE">Sniper Rifle</option>
                  <option value="MACHINE_GUN">Machine Gun</option>
                  <option value="SUBMACHINE_GUN">Submachine Gun</option>
                  <option value="PISTOL">Pistol</option>
                  <option value="SHOTGUN">Shotgun</option>
                  <option value="GRENADE_LAUNCHER">Grenade Launcher</option>
                  <option value="ROCKET_LAUNCHER">Rocket Launcher</option>
                  <option value="MELEE">Melee</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Faction</label>
                <select
                  name="faction"
                  defaultValue={weapon?.faction}
                  required
                  className="input w-full"
                >
                  <option value="NATO">NATO</option>
                  <option value="RUS">RUS</option>
                  <option value="NEUTRAL">Neutral</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mod Source</label>
                <input
                  type="text"
                  name="modSource"
                  defaultValue={weapon?.modSource}
                  required
                  className="input w-full"
                  placeholder="WCS, ACE, RHS, Vanilla"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  name="isActive"
                  defaultValue={weapon?.isActive ? 'true' : 'false'}
                  className="input w-full"
                >
                  <option value="true">Aktiv</option>
                  <option value="false">Inaktiv</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                defaultValue={weapon?.description}
                rows={3}
                className="input w-full resize-none"
                placeholder="Beskrivning av vapnet..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <input
                  type="url"
                  name="imageUrl"
                  defaultValue={weapon?.imageUrl}
                  className="input w-full"
                  placeholder="https://example.com/image.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Icon URL</label>
                <input
                  type="url"
                  name="iconUrl"
                  defaultValue={weapon?.iconUrl}
                  className="input w-full"
                  placeholder="https://example.com/icon.png"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button type="button" onClick={onClose} className="btn-secondary">
                Avbryt
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Spara
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Vehicle Modal (similar to weapon modal - simplified version)
function VehicleModal({ vehicle, onClose }: { vehicle: Vehicle | null; onClose: () => void }) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post('/api/battlelog/vehicles', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['modSources'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await axios.put(`/api/battlelog/vehicles/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onClose();
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get('name') as string,
      displayName: formData.get('displayName') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as VehicleType,
      faction: formData.get('faction') as Faction,
      modSource: formData.get('modSource') as string,
      imageUrl: formData.get('imageUrl') as string,
      iconUrl: formData.get('iconUrl') as string,
      isActive: formData.get('isActive') === 'true',
    };

    if (vehicle) {
      updateMutation.mutate({ id: vehicle.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">
              {vehicle ? 'Redigera Fordon' : 'Lägg till Fordon'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name (ID)</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={vehicle?.name}
                  required
                  className="input w-full"
                  placeholder="m1_abrams"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  name="displayName"
                  defaultValue={vehicle?.displayName}
                  required
                  className="input w-full"
                  placeholder="M1 Abrams"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select name="type" defaultValue={vehicle?.type} required className="input w-full">
                  <option value="TANK">Tank</option>
                  <option value="APC">APC</option>
                  <option value="IFV">IFV</option>
                  <option value="TRUCK">Truck</option>
                  <option value="CAR">Car</option>
                  <option value="HELICOPTER">Helicopter</option>
                  <option value="BOAT">Boat</option>
                  <option value="STATIC_WEAPON">Static Weapon</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Faction</label>
                <select
                  name="faction"
                  defaultValue={vehicle?.faction}
                  required
                  className="input w-full"
                >
                  <option value="NATO">NATO</option>
                  <option value="RUS">RUS</option>
                  <option value="NEUTRAL">Neutral</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mod Source</label>
                <input
                  type="text"
                  name="modSource"
                  defaultValue={vehicle?.modSource}
                  required
                  className="input w-full"
                  placeholder="WCS, ACE, RHS, Vanilla"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  name="isActive"
                  defaultValue={vehicle?.isActive ? 'true' : 'false'}
                  className="input w-full"
                >
                  <option value="true">Aktiv</option>
                  <option value="false">Inaktiv</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                defaultValue={vehicle?.description}
                rows={3}
                className="input w-full resize-none"
                placeholder="Beskrivning av fordonet..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <input
                  type="url"
                  name="imageUrl"
                  defaultValue={vehicle?.imageUrl}
                  className="input w-full"
                  placeholder="https://example.com/image.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Icon URL</label>
                <input
                  type="url"
                  name="iconUrl"
                  defaultValue={vehicle?.iconUrl}
                  className="input w-full"
                  placeholder="https://example.com/icon.png"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button type="button" onClick={onClose} className="btn-secondary">
                Avbryt
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Spara
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
