import { motion } from 'framer-motion';

import { AnimatedCounter } from '@/components/shared/ui/AnimatedCounter';
import { fonts } from '@/components/user-dashboard/connect/ui/theme';

interface StatCardProps {
  label: string;
  value: number;
  valuePrefix?: string;
  valueSuffix?: string;
  description: string;
  delay?: number;
}

export function StatCard({
  label,
  value,
  valuePrefix = '',
  valueSuffix = '',
  description,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
      className="p-8 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-white/10 shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2" style={fonts.body}>
        {label}
      </div>
      <div
        className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2"
        style={fonts.heading}
      >
        {valuePrefix}
        <AnimatedCounter value={value} suffix={valueSuffix} />
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500" style={fonts.body}>
        {description}
      </div>
    </motion.div>
  );
}
