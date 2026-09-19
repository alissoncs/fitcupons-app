'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string };

export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-3">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? 'rounded-[10px] bg-primary-soft px-3 py-2 text-sm font-medium text-primary'
                : 'rounded-[10px] px-3 py-2 text-sm text-ink hover:bg-primary-soft hover:text-primary'
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
