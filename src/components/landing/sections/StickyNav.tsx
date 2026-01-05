import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: "What's included", href: '#features' },
  { label: 'Premium features', href: '#premium-features' },
  { label: 'Plans and pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export const StickyNav = () => {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {

      // Determine active section based on scroll position
      const sections = navItems.map(item => {
        const element = document.querySelector(item.href);
        if (element) {
          const rect = element.getBoundingClientRect();
          return {
            id: item.href,
            top: rect.top,
            bottom: rect.bottom,
          };
        }
        return null;
      }).filter(Boolean) as Array<{ id: string; top: number; bottom: number }>;

      // Find the section currently in view
      // Account for main nav (64px) + sticky nav (~60px) + some padding
      const viewportOffset = 64 + 60 + 20;
      const currentSection = sections.find(
        section => section.top <= viewportOffset && section.bottom >= viewportOffset
      );

      if (currentSection) {
        setActiveSection(currentSection.id);
      } else if (sections.length > 0) {
        // If no section is in view, check which one is closest
        const closest = sections.reduce((prev, curr) => {
          const prevDist = Math.abs(prev.top - viewportOffset);
          const currDist = Math.abs(curr.top - viewportOffset);
          return currDist < prevDist ? curr : prev;
        });
        if (closest && closest.top < window.innerHeight) {
          setActiveSection(closest.id);
        }
      }
    };

    // Use requestAnimationFrame for smoother scroll handling
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      // Offset for main nav (64px) + sticky nav height (~60px) + some padding
      const offset = 64 + 60 + 20;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };


  return (
    <nav
      data-sticky-nav="true"
      className="sticky top-[64px] z-[45] w-full transition-all duration-300"
      style={{ 
        position: 'sticky',
        top: '64px',
        zIndex: 45,
        backgroundColor: 'transparent',
        display: 'flex',
        visibility: 'visible',
        opacity: 1,
        width: '100%',
        minHeight: '80px',
        paddingTop: '48px',
        paddingBottom: '0px',
        margin: 0,
        boxSizing: 'border-box',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div className="flex items-center justify-center gap-1 sm:gap-2 bg-white/[0.05] backdrop-blur-md border border-white/[0.12] rounded-full p-1.5 sm:p-2 shadow-xl overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = activeSection === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleClick(e, item.href)}
                  className={cn(
                    'px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap',
                    'hover:bg-white/[0.1] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-black',
                    isActive
                      ? 'bg-white/[0.15] text-white shadow-md'
                      : 'text-white/90 hover:text-white'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </a>
              );
            })}
      </div>
    </nav>
  );
};

