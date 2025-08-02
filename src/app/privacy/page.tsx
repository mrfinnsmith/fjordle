import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy - Fjordle',
    description: 'Privacy policy for Fjordle, the daily Norwegian fjord puzzle game.',
}

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

            <p className="text-sm text-gray-600 mb-8">
                <strong>Last updated:</strong> August 2, 2025
            </p>

            <div className="prose prose-gray max-w-none">
                <h2 className="text-xl font-semibold mt-6 mb-3">Overview</h2>
                <p className="mb-4">
                    Fjordle is a daily Norwegian fjord puzzle game created by Finn Smith as a fun side project. This privacy policy explains how we handle your information.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">Information We Collect</h2>

                <h3 className="text-lg font-medium mt-4 mb-2">Analytics Data</h3>
                <p className="mb-3">
                    We use Google Analytics to understand how people use Fjordle. This service may collect:
                </p>
                <ul className="list-disc pl-6 mb-4">
                    <li>Pages you visit</li>
                    <li>Time spent on the site</li>
                    <li>Your general location (country/region)</li>
                    <li>Device and browser information</li>
                    <li>How you found our site</li>
                </ul>
                <p className="mb-4">
                    We may also add Mixpanel analytics in the future for similar usage insights.
                </p>

                <h3 className="text-lg font-medium mt-4 mb-2">Game Data</h3>
                <p className="mb-4">
                    We store anonymous game information:
                </p>
                <ul className="list-disc pl-6 mb-4">
                    <li>Your guesses and game sessions (no personal identification)</li>
                    <li>Game statistics stored locally in your browser only</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-3">Information We Don't Collect</h2>
                <ul className="list-disc pl-6 mb-4">
                    <li>Names, email addresses, or contact information</li>
                    <li>Personal accounts or profiles</li>
                    <li>Location data beyond general analytics</li>
                    <li>Any information that identifies you personally</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-3">How We Use Information</h2>
                <ul className="list-disc pl-6 mb-4">
                    <li>Improve the game experience</li>
                    <li>Understand which fjords are most challenging</li>
                    <li>Monitor site performance and usage patterns</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-3">Data Storage</h2>
                <ul className="list-disc pl-6 mb-4">
                    <li>Game progress and statistics are stored locally in your browser</li>
                    <li>Anonymous game data is stored securely on our servers</li>
                    <li>We don't sell or share your information with third parties (except analytics services)</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-3">Your Choices</h2>
                <ul className="list-disc pl-6 mb-4">
                    <li>You can clear your browser data to reset your game statistics</li>
                    <li>You can disable analytics by using browser privacy settings or ad blockers</li>
                    <li>The game works without cookies (though analytics may be limited)</li>
                </ul>

                <h2 className="text-xl font-semibold mt-6 mb-3">Changes to This Policy</h2>
                <p className="mb-4">
                    We may update this privacy policy as we add new features. Check back occasionally for updates.
                </p>

                <h2 className="text-xl font-semibold mt-6 mb-3">Contact</h2>
                <p className="mb-4">
                    For questions about this privacy policy, visit{' '}
                    <a
                        href="https://mrfinnsmith.com"
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        https://mrfinnsmith.com
                    </a>{' '}
                    to find contact information.
                </p>

                <hr className="my-8" />

                <p className="text-sm text-gray-600 italic">
                    Fjordle is an independent project created for educational entertainment about Norwegian geography.
                </p>
            </div>
        </div>
    )
}