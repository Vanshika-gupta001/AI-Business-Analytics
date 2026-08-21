"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  Database,
  Bot,
  FileText,
  BarChart3,
  Menu,
  X,
  Lightbulb,
  Brain,
  LogOut,
  History
} from "lucide-react";

import { useAuth } from "../lib/auth-context";


// Sections that live on the dashboard ("/") as scroll anchors.
const DASHBOARD_SECTIONS = ["dashboard", "dataset", "insights", "predictive", "reports"];


export default function Sidebar({

  onOpenChat

}: {

  onOpenChat: () => void;

}) {

  const { user, logout } = useAuth();

  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  const [activeId, setActiveId] = useState("dashboard");


  const menuGroups = [
    {
      label: "Overview",
      items: [
        { name: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
        { name: "History", icon: History, id: "history", route: "/history" },
        { name: "Dataset", icon: Database, id: "dataset" }
      ]
    },
    {
      label: "Analysis",
      items: [
        { name: "Insights", icon: Lightbulb, id: "insights" },
        { name: "Predictive Modeling", icon: Brain, id: "predictive" },
        { name: "Reports", icon: FileText, id: "reports" }
      ]
    },
    {
      label: "Assistant",
      items: [
        { name: "Ava", icon: Bot, id: "chat" }
      ]
    }
  ];

  // Highlight whichever dashboard section is in view — only relevant
  // while actually on the dashboard page.
  useEffect(() => {

    if (pathname !== "/") return;

    const observer = new IntersectionObserver(
      (entries) => {

        entries.forEach((entry) => {

          if (entry.isIntersecting) {

            setActiveId(entry.target.id);

          }

        });

      },
      {
        rootMargin: "-20% 0px -70% 0px"
      }
    );

    DASHBOARD_SECTIONS.forEach((id) => {

      const el = document.getElementById(id);

      if (el) observer.observe(el);

    });

    return () => observer.disconnect();

  }, [pathname]);

  function handleNavClick(id: string, route?: string) {

    if (id === "chat") {

      if (pathname === "/") {
        onOpenChat();
      } else {
        router.push("/?openChat=1");
      }

      setOpen(false);

      return;

    }

    if (route) {

      router.push(route);

      setOpen(false);

      return;

    }

    // A dashboard-section link (Dashboard/Dataset/Insights/etc.)
    if (pathname === "/") {

      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

      setActiveId(id);

    } else {

      router.push(`/#${id}`);

    }

    setOpen(false);

  }

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Account";

  const initial = displayName.charAt(0).toUpperCase();

  return (

    <>

      {/* Mobile Menu Button */}

      <button

        onClick={() => setOpen(!open)}

        className="
        fixed
        top-5
        left-5
        z-50
        md:hidden
        bg-[var(--color-surface)]
        text-[var(--color-text-primary)]
        border
        border-[var(--color-border)]
        p-3
        rounded-lg
        "

      >

        {open ? <X size={22} /> : <Menu size={22} />}

      </button>


      {/* Sidebar — flex column so the profile footer never overlaps
          scrolling nav content, at any viewport height */}

      <aside

        className={`

        fixed
        top-0
        left-0
        h-screen
        w-64
        z-40

        flex
        flex-col

        bg-[var(--color-ink)]
        border-r
        border-[var(--color-border)]

        p-6

        transition-transform
        duration-300

        ${open ? "translate-x-0" : "-translate-x-full"}

        md:translate-x-0

        `}

      >


        {/* Logo */}

        <div className="flex items-center gap-3 mb-8 flex-shrink-0">

          <div

            className="
            w-9
            h-9
            rounded-md
            bg-[var(--color-accent)]
            flex
            items-center
            justify-center
            flex-shrink-0
            "

          >

            <BarChart3 size={18} className="text-[var(--color-ink)]" />

          </div>

          <div>

            <h1 className="text-[15px] font-semibold text-[var(--color-text-primary)] leading-tight tracking-tight">

              AI Business Analytics

            </h1>

            <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">

              Data Intelligence

            </p>

          </div>

        </div>


        {/* Menu — takes remaining space and scrolls independently */}

        <nav className="space-y-6 flex-1 overflow-y-auto min-h-0">

          {menuGroups.map((group, groupIndex) => (

            <div key={groupIndex}>

              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider px-3 mb-2">

                {group.label}

              </p>

              <div className="space-y-1">

                {group.items.map((item: any, index) => {

                  const Icon = item.icon;

                  const isActive =
                    item.route
                      ? pathname === item.route
                      : item.id !== "chat" && pathname === "/" && activeId === item.id;

                  return (

                    <button

                      onClick={() => handleNavClick(item.id, item.route)}

                      key={index}

                      className={

                        isActive

                          ? "flex items-center gap-3 px-3 py-2.5 rounded-md w-full text-left bg-[var(--color-accent-dim)] text-[var(--color-accent)] transition-colors"
                          : "flex items-center gap-3 px-3 py-2.5 rounded-md w-full text-left text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"

                      }

                    >

                      <Icon size={18} />

                      <span className="text-sm font-medium">{item.name}</span>

                    </button>

                  );

                })}

              </div>

            </div>

          ))}

        </nav>


        {/* Bottom Profile Card — normal flow, always sits below nav,
            never overlaps it */}

        <div

          className="
          flex-shrink-0
          mt-4
          bg-[var(--color-surface)]
          border
          border-[var(--color-border)]
          rounded-lg
          p-3
          flex
          items-center
          gap-3
          "

        >

          <div

            className="
            w-8
            h-8
            rounded-full
            bg-[var(--color-accent)]
            flex
            items-center
            justify-center
            text-xs
            font-semibold
            text-[var(--color-ink)]
            flex-shrink-0
            "

          >

            {initial}

          </div>

          <div className="min-w-0 flex-1">

            <p className="font-medium text-[var(--color-text-primary)] text-sm truncate">

              {displayName}

            </p>

            <p className="text-xs text-[var(--color-text-muted)] truncate">

              {user?.email}

            </p>

          </div>

          <button

            onClick={logout}

            title="Log out"

            className="
            text-[var(--color-text-muted)]
            hover:text-[var(--color-danger)]
            transition-colors
            flex-shrink-0
            "

          >

            <LogOut size={16} />

          </button>

        </div>

      </aside>

    </>

  );

}