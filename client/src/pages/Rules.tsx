import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRules } from '@/hooks/useRules';

const categoryInfo: Record<string, { label: string; icon: typeof AlertTriangle; color: string }> = {
  general: { label: 'Allmänt', icon: AlertTriangle, color: 'text-yellow-400' },
  gameplay: { label: 'Spelregler', icon: CheckCircle, color: 'text-green-400' },
  communication: { label: 'Kommunikation', icon: CheckCircle, color: 'text-blue-400' },
  admin: { label: 'Admin', icon: XCircle, color: 'text-red-400' },
};

export default function Rules() {
  const { data: rules, isLoading, error } = useRules();

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
            <p className="text-gray-400">Laddar regler...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <p className="text-red-400">Ett fel uppstod vid laddning av regler.</p>
          </div>
        </div>
      </div>
    );
  }

  const groupedRules = (rules || []).reduce((acc, rule) => {
    if (!acc[rule.category]) {
      acc[rule.category] = [];
    }
    acc[rule.category].push(rule);
    return acc;
  }, {} as Record<string, typeof rules>);

  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl font-bold mb-4">Serverregler</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Följande regler gäller för alla som spelar på Sweden Vikings servrar.
            Brott mot reglerna kan leda till varning, kick eller ban.
          </p>
        </motion.div>

        {/* Rules */}
        <div className="space-y-8">
          {Object.entries(groupedRules).map(([category, categoryRules], categoryIndex) => {
            const info = categoryInfo[category] || categoryInfo.general;
            const Icon = info.icon;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Icon className={`w-6 h-6 ${info.color}`} />
                  <h2 className="font-display text-2xl font-semibold">{info.label}</h2>
                </div>

                <div className="space-y-4">
                  {categoryRules?.map((rule, index) => (
                    <div key={rule.id} className="card p-6">
                      <div className="flex gap-4">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center font-semibold text-primary-400">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{rule.title}</h3>
                          <p className="text-gray-400">{rule.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty state */}
        {(!rules || rules.length === 0) && (
          <div className="text-center py-16">
            <p className="text-gray-400">Inga regler att visa just nu.</p>
          </div>
        )}

        {/* Footer note */}
        {rules && rules.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
          >
            <div className="flex gap-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1 text-yellow-400">Viktigt</h3>
                <p className="text-gray-300 text-sm">
                  Dessa regler kan uppdateras när som helst. Det är ditt ansvar att hålla dig 
                  uppdaterad om aktuella regler. Vid osäkerhet, kontakta en admin.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
