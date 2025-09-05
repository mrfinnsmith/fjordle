'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/languageContext'
import { useState, useEffect } from 'react'

export default function DebugInfo() {
    const router = useRouter()
    const pathname = usePathname()
    const { language, t } = useLanguage()
    const [url, setUrl] = useState<string>('')
    const [userAgent, setUserAgent] = useState<string>('')
    const [timestamp, setTimestamp] = useState<string>('')

    useEffect(() => {
        setUrl(window.location.href)
        setUserAgent(navigator.userAgent.substring(0, 50))
        setTimestamp(new Date().toISOString())
    }, [])

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
            <div>Language: {language}</div>
            <div>Pathname: {pathname}</div>
            <div>Router exists: {router ? 'YES' : 'NO'}</div>
            <div>Router.push exists: {typeof router?.push === 'function' ? 'YES' : 'NO'}</div>
            <div>URL: {url || t('loading')}</div>
            <div>User Agent: {userAgent || t('loading')}</div><div>Timestamp: {timestamp || t('loading')}</div>
        </div>
    )
} 