'use client'
import Image from 'next/image'

interface Props {
  graySrc: string
  colorSrc: string
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
}

const DEFAULT_SIZES = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'

export function JerseyCover({
  graySrc,
  colorSrc,
  alt,
  className = '',
  priority,
  sizes = DEFAULT_SIZES,
}: Props) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <Image
        src={graySrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover hidden md:block transition-all duration-500 ease-out group-hover:opacity-0 group-hover:scale-105"
      />
      <Image
        src={colorSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover opacity-100 md:opacity-0 md:group-hover:opacity-100 md:scale-100 md:group-hover:scale-105 transition-all duration-500 ease-out"
      />
    </div>
  )
}

export function isCoverPair(images: string[] | undefined): boolean {
  if (!images || images.length < 2) return false
  return (
    images[0]?.includes('/covers/') === true &&
    images[1]?.includes('/covers/') === true
  )
}

export function splitGallery(images: string[]): {
  cover: { gray: string; color: string } | null
  photos: string[]
} {
  if (isCoverPair(images)) {
    return {
      cover: { gray: images[0], color: images[1] },
      photos: images.slice(2),
    }
  }
  return { cover: null, photos: images }
}
