import Image from 'next/image'

interface LoadingSpinnerProps {
    className?: string
}

export default function LoadingSpinner({ className = "w-12 h-12" }: LoadingSpinnerProps) {
    return (
        <div className="flex items-center justify-center">
            <Image
                src="/favicon-32x32.png"
                alt="Loading"
                width={32}
                height={32}
                className={`${className} animate-pulse`}
            />
        </div>
    )
}