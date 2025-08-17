interface LoadingSpinnerProps {
    className?: string
}

export default function LoadingSpinner({ className = "w-12 h-12" }: LoadingSpinnerProps) {
    return (
        <img
            src="/favicon-32x32.png"
            alt="Loading"
            className={`${className} animate-pulse`}
        />
    )
}