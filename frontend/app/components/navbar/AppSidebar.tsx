'use client'

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "../LogoutButton";
import { 
  Ticket, ChevronLeft, ChevronRight, Menu, X, Home,
  User, Settings, ShieldUser, LayoutDashboard, Building2,
} from "lucide-react"

interface AppSidebarProps {
  appUser: any
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tickets", href: "/tickets", icon: Ticket },
  { label: "Register User", href: "/auth/register", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Admin", href: "/admin", icon: ShieldUser },
];

const AppSidebar: React.FC<AppSidebarProps> = ({ appUser }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isMediumScreen, setIsMediumScreen] = useState(false);

  // Detect screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsSmallScreen(width < 768);
      setIsMediumScreen(width >= 768 && width < 1200);
      
      if (width >= 1200) {
        setIsOpen(true);
      } else if (width >= 768) {
        setIsOpen(false);
      } else {
        setIsOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLinkClick = () => {
    if (isSmallScreen || isMediumScreen) {
      setIsOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const visibleNavItems = navItems.filter(item => {
    if (item.label === "Register User") {
      return appUser?.is_admin;
    }
    if (item.label === "Admin") {
      return appUser?.is_admin;
    }
    if (item.label === "Settings") {
      return appUser?.is_admin;
    }
    return true;
  });

  return (
    <>
      {/* Mobile Menu Button */}
      {isSmallScreen && !isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-lg hover:shadow-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Overlay */}
      {isOpen && (isSmallScreen || isMediumScreen) && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 
        shadow-2xl z-50 transition-all duration-300 ease-in-out overflow-hidden
        flex flex-col
        ${isOpen 
          ? isSmallScreen
            ? "w-80 translate-x-0"
            : isMediumScreen
              ? "w-80 translate-x-0"
              : "w-80 translate-x-0"
          : isSmallScreen
            ? "w-0 -translate-x-full"
            : isMediumScreen
              ? "w-20 -translate-x-0"
              : "w-20 -translate-x-0"
        }
      `}>
        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-6 border-b border-gray-700/50">
          {/* Logo Area */}
          <div 
            onClick={() => window.location.href = "/"}
            className={`flex items-center gap-3 transition-all duration-300 cursor-pointer ${
              isOpen || isSmallScreen ? "flex-1" : "hidden"
            }`}
          >
            <div className="flex-1 min-w-0">
              <Image
                src={appUser.company_logo || "/logo-placeholder.png"}
                alt={appUser.company}
                width={120}
                height={40}
                priority
                className="w-full h-auto max-h-25 object-contain bg-gray-800 rounded-lg p-1"
                unoptimized
              />
            </div>
          </div>
          
          {/* Toggle & Close Buttons */}
          <div className="flex items-center gap-2">
            {!isSmallScreen && (
              <button 
                onClick={toggleSidebar}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all duration-300"
                aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            )}
            
            {isSmallScreen && (
              <button 
                onClick={toggleSidebar}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all duration-300"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          <div className="px-4 py-6">
            {/* Welcome Section */}
            {(isOpen || isSmallScreen) && (
              <div className="mb-8 px-3 py-4 bg-gray-800/50 rounded-2xl border border-gray-700/30">
                <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
                  Welcome back,
                </p>
                <p className="text-white font-semibold truncate uppercase tracking-widest">
                  {appUser.name?.split(' ')[0] || 'User'}
                </p>
              </div>
            )}

            {/* Navigation Items */}
            <nav className="space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`
                      group flex items-center rounded-xl transition-all duration-200
                      ${isOpen || isSmallScreen ? "gap-3 px-4" : "justify-center px-2"}
                      ${isActive 
                        ? "bg-gradient-to-r from-blue-600/20 to-blue-500/10 text-blue-400" 
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      }
                    `}
                  >
                    <div className={`
                      relative py-3 transition-all duration-200
                      ${isOpen || isSmallScreen ? "" : "w-full flex justify-center"}
                    `}>
                      <div className={`
                        flex items-center transition-all duration-200
                        ${isOpen || isSmallScreen ? "gap-3" : "justify-center"}
                      `}>
                        <div className={`
                          p-2 rounded-xl transition-all duration-200
                          ${isActive 
                            ? 'bg-blue-600/20 text-blue-400' 
                            : 'bg-gray-800/50 text-gray-400 group-hover:bg-gray-700/50 group-hover:text-white'
                          }
                        `}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        {(isOpen || isSmallScreen) && (
                          <span className="font-medium whitespace-nowrap flex items-center">
                            {item.label}
                          </span>
                        )}
                      </div>
                    </div>

                      {isActive && (isOpen || isSmallScreen) && (
                        <div className="ml-auto">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        </div>
                      )}
                    
                    {/* Tooltip for collapsed state */}
                    {!isOpen && isMediumScreen && (
                      <div className="fixed left-20 ml-2 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 shadow-xl whitespace-nowrap border border-gray-700">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
          {/* User Info */}
          {(isOpen || isSmallScreen) && (
            <div className="p-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 border border-gray-700/30">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{appUser.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-medium text-gray-400">
                      {appUser.is_admin ? "Admin" : "User"}
                    </span>
                    <span className="text-sm font-medium text-gray-400">|</span>
                    <span className="text-sm font-medium text-gray-400 truncate">{appUser.department}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <div className={`flex items-center relative p-4 ${
            isOpen || isSmallScreen ? "gap-3" : "justify-center"
          }`}>
            <LogoutButton 
              className={`
                flex items-center justify-center gap-2 rounded-xl font-medium
                transition-all duration-300
                ${isOpen || isSmallScreen 
                  ? "w-full py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20"
                  : "w-full p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/20"
                }
              `}
            />
            
            {/* Tooltip for collapsed medium screens */}
            {!isOpen && isMediumScreen && (
              <span className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity duration-300 z-50 shadow-lg">
                Sign Out
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`
        transition-all duration-300 ease-in-out min-h-screen bg-gray-50
        ${isSmallScreen 
          ? "ml-0" 
          : isMediumScreen
            ? isOpen 
              ? "md:ml-80" 
              : "md:ml-20"
            : isOpen 
              ? "lg:ml-80" 
              : "lg:ml-20"
        }
      `}>
        {/* Your content goes here */}
      </main>
    </>
  );
};

export default AppSidebar;