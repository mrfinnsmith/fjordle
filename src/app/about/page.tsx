export default function About() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">About</h1>

            <div className="space-y-4">
                <p>
                    Fjordle was created with love for Norwegian geography by{' '}
                    <a
                        href="https://mrfinnsmith.com"
                        className="font-medium hover:underline text-blue-600 hover:text-blue-800"
                    >
                        Finn Smith
                    </a>.
                </p>
                <p>
                    Inspired by the distinctive beauty of Norwegian fjords,
                    this daily puzzle challenges players to identify fjords from their
                    unique outline shapes using distance and direction clues.
                </p>
                <p>
                    Want to collaborate on puzzles or have suggestions? Reach out via any of{' '}
                    <a
                        href="https://mrfinnsmith.com/about"
                        className="font-medium hover:underline text-blue-600 hover:text-blue-800"
                    >
                        my online platforms
                    </a>.
                </p>
            </div>
        </div>
    );
}