import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Server,
  Shield,
  Calendar,
  ChevronRight,
  Zap,
  Globe,
  Gamepad2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

// Server status mock - will be replaced with real data
const serverStatus = {
  isOnline: true,
  players: 24,
  maxPlayers: 64,
  map: 'Everon',
};

const features = [
  {
    icon: Gamepad2,
    title: 'Taktiskt Spelande',
    description: 'Realistiska operationer med fokus på teamwork och strategi.',
  },
  {
    icon: Users,
    title: 'Aktiv Community',
    description: 'En vänlig och välkomnande gemenskap för alla spelare.',
  },
  {
    icon: Shield,
    title: 'Erfarna Admins',
    description: 'Dedikerat team som säkerställer en bra spelupplevelse.',
  },
  {
    icon: Calendar,
    title: 'Regelbundna Events',
    description: 'Organiserade operationer och tävlingar varje vecka.',
  },
];

const stats = [
  { value: '500+', label: 'Medlemmar' },
  { value: '24/7', label: 'Server Uptime' },
  { value: '50+', label: 'Events/månad' },
  { value: '2024', label: 'Etablerad' },
];

export default function Home() {
  const { login, isAuthenticated } = useAuthStore();
  const [currentStat, setCurrentStat] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-hero-gradient">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/30 rounded-full blur-[128px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-600/20 rounded-full blur-[128px] animate-pulse-slow delay-1000" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/20 border border-primary-500/30 text-primary-400 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
              </span>
              Arma Reforger Community
            </div>

            {/* Title */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="block">Välkommen till</span>
              <span className="block gradient-text">Sweden Vikings</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              En svensk gaming community för Arma Reforger. Gå med oss för taktiskt 
              spelande, organiserade operationer och en fantastisk gemenskap.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <button onClick={login} className="btn-primary text-lg px-8 py-3">
                  <img src="/steam-logo.svg" alt="" className="w-6 h-6" />
                  Gå med nu
                </button>
              ) : (
                <Link to="/clans" className="btn-primary text-lg px-8 py-3">
                  <Users className="w-5 h-5" />
                  Utforska Clans
                </Link>
              )}
              <Link to="/rules" className="btn-secondary text-lg px-8 py-3">
                Läs våra regler
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>

          {/* Server Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16"
          >
            <div className="inline-block">
              <div className="card p-6 backdrop-blur-xl bg-background-card/80">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${serverStatus.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium">
                      {serverStatus.isOnline ? 'Server Online' : 'Server Offline'}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">
                      <span className="font-semibold text-primary-400">{serverStatus.players}</span>
                      <span className="text-gray-400">/{serverStatus.maxPlayers}</span>
                    </span>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{serverStatus.map}</span>
                  </div>
                  <button className="btn-accent text-sm ml-4">
                    Anslut
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 rounded-full bg-white/60"
            />
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background-darker relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/5 via-transparent to-accent-600/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-display font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold mb-4">
              Varför välja <span className="gradient-text">Sweden Vikings</span>?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Vi erbjuder en unik spelupplevelse med fokus på community, 
              realism och gemenskap.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="card-hover p-6 h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600/20 to-accent-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/50 to-background-dark" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Zap className="w-16 h-16 mx-auto mb-6 text-accent-400" />
            <h2 className="font-display text-4xl font-bold mb-4">
              Redo att börja?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Gå med i Sweden Vikings idag och bli en del av vår växande community.
              Logga in med Steam för att komma igång.
            </p>
            {!isAuthenticated ? (
              <button onClick={login} className="btn-primary text-lg px-8 py-3">
                <img src="/steam-logo.svg" alt="" className="w-6 h-6" />
                Logga in med Steam
              </button>
            ) : (
              <Link to="/clans" className="btn-primary text-lg px-8 py-3">
                Utforska Community
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

