import { useState, useCallback, useEffect, useRef } from 'react';
import { ProfileMenu } from './profile/ProfileMenu';
import { NotificationBadge } from './notifications/NotificationBadge';
import { Moon, Sun, Calendar } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { MonthlyCalendar } from './MonthlyCalendar';
import type { NavPage } from '../types/navigation';
import type { Task } from '../types/task';

interface NavigationProps {
  onLogout: () => void;
  hasUnreadNotifications: boolean;
  onNotificationsClick: () => void;
  activePage: NavPage;
  onPageChange: (page: NavPage) => void;
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  taskStats: {
    total: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  tasks: Task[];
}

export function Navigation({ 
  onLogout, 
  hasUnreadNotifications, 
  onNotificationsClick,
  activePage,
  onPageChange,
  user,
  taskStats,
  tasks = []
}: NavigationProps) {
  const { isDark, toggle } = useTheme();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const isMobileView = useRef(window.innerWidth < 768);
  const ticking = useRef(false);
  const userScrolling = useRef<NodeJS.Timeout | null>(null);

  // Throttled scroll handler for better performance
  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        
        // Only apply hide logic on mobile
        if (isMobileView.current) {
          // If scrolling down and past threshold
          if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
            setHeaderVisible(false);
          } 
          // If scrolling up
          else if (currentScrollY < lastScrollY.current) {
            setHeaderVisible(true);
          }
          
          // Reset user scrolling timeout
          if (userScrolling.current) {
            clearTimeout(userScrolling.current);
          }
          
          // Show header after user stops scrolling for 1.5 seconds
          userScrolling.current = setTimeout(() => {
            setHeaderVisible(true);
          }, 1500);
        }
        
        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
      
      ticking.current = true;
    }
  }, []);

  useEffect(() => {
    const checkMobileView = () => {
      isMobileView.current = window.innerWidth < 768;
      // Always show header on desktop
      if (!isMobileView.current) {
        setHeaderVisible(true);
      }
    };

    checkMobileView(); // Initial check
    
    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkMobileView, { passive: true });

    return () => {
      // Cleanup event listeners
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobileView);
      if (userScrolling.current) {
        clearTimeout(userScrolling.current);
      }
    };
  }, [handleScroll]);

  const handleCalendarToggle = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  // We'll just use click events which work for both mouse and touch
  // without needing to preventDefault()

  const handleDateSelect = (date: Date) => {
    // Update local state
    setSelectedDate(date);
    setIsCalendarOpen(false);
    
    // Always navigate to upcoming page
    onPageChange('upcoming');
    
    try {
      // Optimize date formatting - direct string extraction is faster than string padding
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      // Format with ternary operators for better performance
      const formattedDate = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
      
      // Use URLSearchParams constructor directly with an object for better performance
      const params = new URLSearchParams(window.location.search);
      params.set('selectedDate', formattedDate);
      
      // Force URL update with correct date parameter
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({ path: newUrl, date: formattedDate }, '', newUrl);
      
      // Dispatch a custom event to notify other components
      const dateSelectedEvent = new CustomEvent('dateSelected', { detail: { date } });
      window.dispatchEvent(dateSelectedEvent);
      
      // For debugging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Navigation: Selected date and updated URL', formattedDate);
      }
    } catch (error) {
      console.error('Error setting date parameter:', error);
    }
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
          !headerVisible && isMobileView.current ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-b border-gray-200/70 dark:border-gray-800/70 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <div className="flex justify-between items-center h-14">
              {/* Logo and Brand */}
              <div className="flex-shrink-0 flex items-center">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent transition-all duration-300">
                    NestTask
                  </h1>
                </div>
              </div>

              {/* Right Section - Action Icons */}
              <div className="flex items-center">
                {/* Mobile-optimized icons with improved alignment and spacing */}
                <div className="inline-flex items-center justify-center bg-gray-50/30 dark:bg-gray-800/30 rounded-xl px-1.5 py-1 gap-2.5 sm:gap-3 md:gap-4">
                  {/* Theme Toggle Button */}
                  <button
                    onClick={toggle}
                    className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-50/90 dark:bg-gray-800/90 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:focus-visible:ring-blue-400/50 active:scale-95"
                    aria-label="Toggle theme"
                  >
                    {isDark ? (
                      <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-500" strokeWidth={1.75} />
                    ) : (
                      <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-600" strokeWidth={1.75} />
                    )}
                  </button>

                  {/* Calendar Button */}
                  <button
                    onClick={handleCalendarToggle}
                    className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gray-50/90 dark:bg-gray-800/90 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:focus-visible:ring-blue-400/50 active:scale-95"
                    aria-label="Show calendar"
                  >
                    <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-600 dark:text-blue-400" strokeWidth={1.75} />
                  </button>

                  {/* Profile Menu */}
                  <ProfileMenu onLogout={onLogout} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Monthly Calendar */}
      <MonthlyCalendar
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelectDate={handleDateSelect}
        tasks={tasks}
      />
    </>
  );
}