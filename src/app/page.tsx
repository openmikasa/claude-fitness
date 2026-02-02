'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { BulkMigrationModal } from '@/components/workout/bulk-migration-modal';

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [unmigratedCount, setUnmigratedCount] = useState<number>(0);
  const [showBackfillModal, setShowBackfillModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user) {
      fetchUnmigratedCount();
    }
  }, [user, loading]);

  const fetchUnmigratedCount = async () => {
    try {
      const response = await fetch('/api/workouts/unmigrated-count', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUnmigratedCount(data.count || 0);
      } else if (response.status !== 401) {
        console.error('Failed to fetch unmigrated count:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch unmigrated count:', error);
    }
  };

  const handleBackfillComplete = () => {
    setUnmigratedCount(0);
    setShowBackfillModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="text-lg font-bold uppercase">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b-3 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-end items-center">
          <button
            onClick={() => signOut()}
            className="text-sm font-bold text-black hover:text-[#22FF00] transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Heading */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-black leading-tight">
            <span className="inline">YOUR </span>
            <span className="inline relative">
              WINTER
              <span className="absolute bottom-1 left-0 w-full h-2 bg-[#22FF00] -z-10"></span>
            </span>
            <br />
            <span className="inline relative">
              ARC
              <span className="absolute bottom-1 left-0 w-full h-2 bg-[#22FF00] -z-10"></span>
            </span>
            <span className="inline"> STARTS</span>
            <br />
            <span className="inline relative">
              HERE
              <span className="absolute bottom-1 left-0 w-full h-2 bg-[#22FF00] -z-10"></span>
            </span>
          </h1>
        </div>

        {/* System Ready Callout */}
        <div className="border-l-4 border-[#22FF00] pl-4 mb-8">
          <p className="font-bold text-[#22FF00] font-mono text-sm">&gt;&gt;&gt; SYSTEM READY</p>
          <p className="text-gray-600 text-sm font-mono">
            Start by uploading your training history, then generate a new AI-powered program.
          </p>
        </div>

        {/* Backfill Banner */}
        {unmigratedCount > 0 && (
          <div
            className="mb-8 bg-white border-3 border-black border-l-6 border-l-[#22FF00] p-4 rounded-sm shadow-brutal"
            data-testid="backfill-banner"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold uppercase text-black mb-1">
                  Enhance Your Workout Data
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  You have {unmigratedCount} workout{unmigratedCount !== 1 ? 's' : ''} that can be
                  enhanced with equipment and muscle group data.
                </p>
                <button
                  onClick={() => setShowBackfillModal(true)}
                  className="px-4 py-3 bg-[#22FF00] text-black border-3 border-black rounded-sm font-bold uppercase shadow-brutal hover:shadow-brutal-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm"
                >
                  Start Migration
                </button>
              </div>
              <button
                onClick={() => setUnmigratedCount(0)}
                className="text-black hover:text-[#22FF00] text-2xl font-bold ml-4"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Bulk Migration Modal */}
        <BulkMigrationModal
          isOpen={showBackfillModal}
          onClose={() => setShowBackfillModal(false)}
          onComplete={handleBackfillComplete}
        />

        {/* Action Cards Grid - 2 columns */}
        <div className="grid grid-cols-2 gap-4">
          <ActionCard
            title={["LOG", "WORKOUT"]}
            subtitle="RECORD SESSION"
            href="/workouts/log"
            icon={<DumbbellIcon />}
          />
          <ActionCard
            title={["VIEW", "HISTORY"]}
            subtitle="BROWSE PAST"
            href="/workouts"
            icon={<ChartIcon />}
          />
          <ActionCard
            title={["AI PROGRAM"]}
            subtitle="GENERATE NEW"
            href="/programs"
            icon={<RobotIcon />}
          />
          <ActionCard
            title={["IMPORT DATA"]}
            subtitle="CSV UPLOAD"
            href="/workouts/import"
            icon={<DownloadIcon />}
          />
          <ActionCard
            title={["SETTINGS"]}
            subtitle="PREFERENCES"
            href="/settings"
            icon={<GearIcon />}
          />
          <ActionCard
            title={["HELP"]}
            subtitle="GUIDES & DOCS"
            href="/help"
            icon={<HelpIcon />}
          />
        </div>
      </main>

      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-3 border-black md:hidden">
        <div className="grid grid-cols-4 gap-1">
          <NavButton href="/" label="Home" icon="🏠" />
          <NavButton href="/workouts/log" label="Log" icon="➕" />
          <NavButton href="/workouts" label="History" icon="📖" />
          <NavButton href="/programs" label="Plan" icon="📋" />
        </div>
      </nav>
    </div>
  );
}

function ActionCard({ title, subtitle, href, icon }: {
  title: string[];
  subtitle: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block p-6 bg-white rounded-sm border-3 border-black hover:border-[#22FF00] hover:shadow-brutal transition-all min-h-[180px]"
    >
      <div className="mb-6">
        {icon}
      </div>
      <div>
        {title.map((line, i) => (
          <h3 key={i} className="text-lg font-black uppercase text-black leading-tight">
            {line}
          </h3>
        ))}
      </div>
      <p className="text-xs text-gray-500 uppercase tracking-wider mt-2 font-mono">
        {subtitle}
      </p>
    </Link>
  );
}

function NavButton({ href, label, icon }: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center py-3 text-black hover:text-[#22FF00] transition-colors"
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xs font-bold uppercase">{label}</span>
    </Link>
  );
}

// SVG Icons
function DumbbellIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5L17.5 17.5" />
      <path d="M17.5 6.5L6.5 17.5" />
      <path d="M3 9L9 3" />
      <path d="M15 21L21 15" />
      <path d="M3 15L9 21" />
      <path d="M15 3L21 9" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="8" width="4" height="12" rx="1" />
    </svg>
  );
}

function RobotIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <circle cx="9" cy="13" r="1.5" fill="currentColor" />
      <circle cx="15" cy="13" r="1.5" fill="currentColor" />
      <path d="M9 17h6" />
      <path d="M12 2v4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12" />
      <path d="M8 12l4 4 4-4" />
      <path d="M4 18h16" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}
