'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/languageContext'

export default function DebugInfo() {
    const router = useRouter()
    const pathname = usePathname()
    const { language, mounted } = useLanguage()

    console.log('[DEBUG] DebugInfo render')

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            background: 'black',
            color: 'white',
            padding: '10px',
            fontSize: '12px',
            zIndex: 9999,
            maxWidth: '300px',
            fontFamily: 'monospace'
        }}>
            <div>Environment: {process.env.NODE_ENV}</div>
            <div>Mounted: {mounted ? 'YES' : 'NO'}</div>
            <div>Language: {language}</div>
            <div>Pathname: {pathname}</div>
            <div>Router exists: {router ? 'YES' : 'NO'}</div>
            <div>Router.push exists: {router?.push ? 'YES' : 'NO'}</div>
            <div>URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</div>
            <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'SSR'}</div>
            <div>Timestamp: {new Date().toISOString()}</div>
        </div>
    )
} 