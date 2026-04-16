import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  variant?: 'full' | 'text' | 'icon'
  className?: string
}

export function Logo({ variant = 'full', className = '' }: LogoProps) {
  if (variant === 'text') {
    return (
      <Link href="/" className={`flex items-center ${className}`}>
        <span className="text-xl font-bold tracking-tighter">
          <span className="text-primary">GABINETE</span>
          <span className="text-foreground">//</span>
          <span className="text-foreground">FC</span>
        </span>
      </Link>
    )
  }

  if (variant === 'icon') {
    return (
      <Link href="/" className={`flex items-center ${className}`}>
        <Image
          src="/logo/gabinete-fc-icon.png"
          alt="Gabinete FC"
          width={40}
          height={40}
          priority
          className="h-10 w-10 object-contain"
        />
      </Link>
    )
  }

  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <Image
        src="/logo/gabinete-fc-logo.png"
        alt="Gabinete FC"
        width={200}
        height={70}
        priority
        className="h-12 w-auto object-contain"
      />
    </Link>
  )
}
