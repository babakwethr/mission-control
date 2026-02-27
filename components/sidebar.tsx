'use client'

import Link from 'next/link'
import { Home, Folder, ListTodo, Activity, Settings, User, Bot, LayoutDashboard, Calendar, ClipboardList, Menu, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const links = [
    { href: '/', label: 'Morning Brief', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: Folder },
    { href: '/kanban', label: 'Kanban Board', icon: Calendar },
    { href: '/tasks', label: 'All Tasks', icon: ClipboardList },
    { href: '/notes', label: 'Notes', icon: FileText },
    { href: '/activity', label: 'Activity Log', icon: Activity },
    { href: '/admin', label: 'Admin', icon: Settings },
  ]

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between h-14 px-6 border-b shrink-0 bg-background/95 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <Activity className="h-6 w-6 text-primary" />
          <span>Mission Control</span>
        </Link>
        <button 
          onClick={() => setIsOpen(false)}
          className="md:hidden p-2 hover:bg-muted rounded-md"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-2 text-sm font-medium gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                pathname === link.href ? "bg-muted text-primary" : "text-muted-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-4 mt-auto">
        <div className="flex items-center gap-3 rounded-lg bg-background border px-3 py-3 shadow-sm">
           <div className="bg-primary/10 p-2 rounded-full">
             <Bot className="h-5 w-5 text-primary" />
           </div>
           <div className="flex flex-col">
             <span className="text-sm font-medium">Sara (Operator)</span>
             <span className="text-xs text-green-600 font-medium flex items-center gap-1">
               <span className="block h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
               Working
             </span>
           </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur z-40 flex items-center px-4 justify-between">
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-muted rounded-md"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="font-semibold text-sm">Mission Control</div>
        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out flex flex-col md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </div>
    </>
  )
}
