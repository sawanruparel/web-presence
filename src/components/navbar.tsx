import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { Bars2Icon } from '@heroicons/react/24/solid'
import { motion } from 'framer-motion'
import { Link } from './link.tsx'
import { Logo } from './logo.tsx'

const links = [
  { href: '#expertise', label: 'Expertise' },
  { href: '#portfolio', label: 'Journey' },
]

function DesktopNav() {
  return (
    <nav className="relative hidden lg:flex">
      {links.map(({ href, label }) => (
        <div key={href} className="relative flex">
          <Link
            href={href}
            className="flex items-center px-4 py-3 text-base font-medium text-white data-hover:text-gray-200"
          >
            {label}
          </Link>
        </div>
      ))}
    </nav>
  )
}

function MobileNavButton() {
  return (
    <DisclosureButton
      className="flex size-12 items-center justify-center self-center rounded-lg data-hover:bg-black/5 lg:hidden"
      aria-label="Open main menu"
    >
      <Bars2Icon className="size-6" />
    </DisclosureButton>
  )
}

function MobileNav() {
  return (
    <DisclosurePanel className="lg:hidden">
      <div className="flex flex-col gap-6 py-4">
        {links.map(({ href, label }, linkIndex) => (
          <motion.div
            initial={{ opacity: 0, rotateX: -90 }}
            animate={{ opacity: 1, rotateX: 0 }}
            transition={{
              duration: 0.15,
              ease: 'easeInOut',
              rotateX: { duration: 0.3, delay: linkIndex * 0.1 },
            }}
            key={href}
          >
            <Link href={href} className="text-base font-medium text-white">
              {label}
            </Link>
          </motion.div>
        ))}
      </div>
    </DisclosurePanel>
  )
}

export function Navbar() {
  return (
    <Disclosure as="header" className="pt-12 sm:pt-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative flex justify-between items-center">
          <div className="relative flex gap-6">
            <div className="py-3">
              <Link href="/" title="Home">
                <Logo className="h-9" />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <DesktopNav />
            <Link 
              href="#contact" 
              className="bg-white hover:bg-gray-100 text-black px-6 py-2 rounded-lg font-semibold transition-colors hidden lg:block"
            >
              Contact us
            </Link>
            <MobileNavButton />
          </div>
        </div>
      </div>
      <MobileNav />
    </Disclosure>
  )
}
