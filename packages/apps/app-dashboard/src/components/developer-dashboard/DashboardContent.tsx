import { useState, useEffect } from 'react';
import { SquareStack, Wrench, Shield, BookOpen, ArrowRight, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

import { MenuId } from '@/types/developer-dashboard/menuId';
import { DashboardCard } from '@/components/developer-dashboard/ui/DashboardCard';
import { theme, fonts } from '@/components/user-dashboard/connect/ui/theme';

interface DashboardContentProps {
  filteredAppsCount: number;
  filteredAbilitiesCount: number;
  filteredPoliciesCount: number;
  onMenuSelection: (id: MenuId) => void;
}

export function DashboardContent({
  filteredAppsCount,
  filteredAbilitiesCount,
  filteredPoliciesCount,
  onMenuSelection,
}: DashboardContentProps) {
  const [showContent, setShowContent] = useState(false);
  const currentTime = new Date().getHours();
  const greeting =
    currentTime < 12 ? 'Good morning' : currentTime < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    // Fade in content after mount
    setShowContent(true);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: showContent ? 1 : 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="w-full"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Greeting Section */}
        <div className="text-center mb-10 sm:mb-12 pt-8">
          <h1
            className={`text-3xl sm:text-4xl font-semibold ${theme.text} mb-3`}
            style={fonts.heading}
          >
            {greeting}, Developer
          </h1>
          <p
            className={`text-base sm:text-lg ${theme.textMuted} leading-relaxed`}
            style={fonts.body}
          >
            Build and manage your Vincent applications
          </p>
        </div>

        {/* Info Banner */}
        <div
          className={`${theme.mainCard} border rounded-xl p-6 mb-10 sm:mb-12`}
          style={{ borderColor: `${theme.brandOrange}33` }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${theme.brandOrange}33` }}
              >
                <BookOpen className="h-5 w-5" style={{ color: theme.brandOrange }} />
              </div>
              <div>
                <p className={`font-semibold ${theme.text} mb-1`} style={fonts.heading}>
                  New to Vincent?
                </p>
                <p className={`text-sm ${theme.textMuted} leading-relaxed`} style={fonts.body}>
                  Get started with our quick start guide and join the builder's community
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-4">
              <button
                onClick={() => window.open('https://docs.heyvincent.ai', '_blank')}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: theme.brandOrange, ...fonts.heading }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.brandOrange;
                }}
              >
                View Docs
              </button>
              <button
                onClick={() => window.open('https://t.me/+vZWoA5k8jGoxZGEx', '_blank')}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: theme.brandOrange, ...fonts.heading }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.brandOrangeDarker;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.brandOrange;
                }}
              >
                Builder's Thread
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12">
          <DashboardCard onClick={() => onMenuSelection('apps/create-app')}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors"
              style={{ backgroundColor: `${theme.brandOrange}1A` }}
            >
              <Plus className="w-5 h-5" style={{ color: theme.brandOrange }} />
            </div>
            <h3 className={`font-semibold ${theme.text} mb-2 text-lg`} style={fonts.heading}>
              Create App
            </h3>
            <p className={`text-sm ${theme.textMuted} mb-4 leading-relaxed`} style={fonts.body}>
              Build a new application on Vincent
            </p>
            <div
              className="flex items-center text-sm transition-colors"
              style={{ color: theme.brandOrange }}
            >
              Get Started <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </DashboardCard>

          <DashboardCard onClick={() => onMenuSelection('abilities/create-ability')}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors"
              style={{ backgroundColor: `${theme.brandOrange}1A` }}
            >
              <Wrench className="w-5 h-5" style={{ color: theme.brandOrange }} />
            </div>
            <h3 className={`font-semibold ${theme.text} mb-2 text-lg`} style={fonts.heading}>
              Create Ability
            </h3>
            <p className={`text-sm ${theme.textMuted} mb-4 leading-relaxed`} style={fonts.body}>
              Define reusable capabilities for apps
            </p>
            <div
              className="flex items-center text-sm transition-colors"
              style={{ color: theme.brandOrange }}
            >
              Get Started <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </DashboardCard>

          <DashboardCard onClick={() => onMenuSelection('policies/create-policy')}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors"
              style={{ backgroundColor: `${theme.brandOrange}1A` }}
            >
              <Shield className="w-5 h-5" style={{ color: theme.brandOrange }} />
            </div>
            <h3 className={`font-semibold ${theme.text} mb-2 text-lg`} style={fonts.heading}>
              Create Policy
            </h3>
            <p className={`text-sm ${theme.textMuted} mb-4 leading-relaxed`} style={fonts.body}>
              Define reusable restrictions for abilities
            </p>
            <div
              className="flex items-center text-sm transition-colors"
              style={{ color: theme.brandOrange }}
            >
              Get Started <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </DashboardCard>
        </div>

        {/* Projects Section */}
        <div className="mb-12">
          <h2 className={`text-xl font-semibold ${theme.text} mb-6`} style={fonts.heading}>
            Your Projects
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <DashboardCard onClick={() => onMenuSelection('apps')}>
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${theme.brandOrange}1A` }}
                >
                  <SquareStack className="w-5 h-5" style={{ color: theme.brandOrange }} />
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${theme.text}`} style={fonts.heading}>
                    {filteredAppsCount}
                  </p>
                </div>
              </div>
              <h3 className={`font-semibold ${theme.text} mb-2 text-lg`} style={fonts.heading}>
                Apps
              </h3>
              <p className={`text-sm ${theme.textMuted} leading-relaxed`} style={fonts.body}>
                Manage your applications
              </p>
            </DashboardCard>

            <DashboardCard onClick={() => onMenuSelection('abilities')}>
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${theme.brandOrange}1A` }}
                >
                  <Wrench className="w-5 h-5" style={{ color: theme.brandOrange }} />
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${theme.text}`} style={fonts.heading}>
                    {filteredAbilitiesCount}
                  </p>
                </div>
              </div>
              <h3 className={`font-semibold ${theme.text} mb-2 text-lg`} style={fonts.heading}>
                Abilities
              </h3>
              <p className={`text-sm ${theme.textMuted} leading-relaxed`} style={fonts.body}>
                Manage your abilities
              </p>
            </DashboardCard>

            <DashboardCard onClick={() => onMenuSelection('policies')}>
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${theme.brandOrange}1A` }}
                >
                  <Shield className="w-5 h-5" style={{ color: theme.brandOrange }} />
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${theme.text}`} style={fonts.heading}>
                    {filteredPoliciesCount}
                  </p>
                </div>
              </div>
              <h3 className={`font-semibold ${theme.text} mb-2 text-lg`} style={fonts.heading}>
                Policies
              </h3>
              <p className={`text-sm ${theme.textMuted} leading-relaxed`} style={fonts.body}>
                Manage your policies
              </p>
            </DashboardCard>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
