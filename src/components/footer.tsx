import { Link } from './link.tsx'
import { Logo } from './logo.tsx'

export function Footer() {
  return (
    <footer className="bg-black">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
          <div className="flex flex-col gap-4">
            <Logo className="h-8 text-white" />
            <p className="text-white max-w-md">
              VP of Engineering at BCG X, leading AI & healthcare innovation with 18+ years of software development experience.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Expertise</h3>
              <ul className="space-y-3">
                <li><Link href="#expertise" className="!text-white hover:!text-gray-300 text-sm">AI & Healthcare</Link></li>
                <li><Link href="#expertise" className="!text-white hover:!text-gray-300 text-sm">Software Development</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                <li><Link href="#about" className="!text-white hover:!text-gray-300 text-sm">About</Link></li>
                <li><Link href="#contact" className="!text-white hover:!text-gray-300 text-sm">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><Link href="#portfolio" className="!text-white hover:!text-gray-300 text-sm">Journey</Link></li>
                <li><Link href="https://lazyspark.svbtle.com" className="!text-white hover:!text-gray-300 text-sm">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Connect</h3>
              <ul className="space-y-3">
                <li><Link href="https://linkedin.com/in/sawanruparel" className="!text-white hover:!text-gray-300 text-sm">LinkedIn</Link></li>
                <li><Link href="https://mentorcruise.com/mentor/sawanruparel" className="!text-white hover:!text-gray-300 text-sm">Mentoring</Link></li>
                <li><Link href="https://lazyspark.svbtle.com" className="!text-white hover:!text-gray-300 text-sm">Writing</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-12 border-t border-white pt-8">
            <p className="text-white text-sm">
            © 2024 Sawan Ruparel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
