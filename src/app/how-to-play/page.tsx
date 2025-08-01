export default function HowToPlay() {
    return (
        <div className="page-content">
            <h2 className="text-2xl font-bold page-text mb-6">How to Play</h2>

            <div className="space-y-6 page-text">
                <section>
                    <h3 className="text-lg font-semibold mb-3">The Goal</h3>
                    <p>Guess the Norwegian fjord from its distinctive outline shape in 6 attempts or fewer.</p>
                </section>

                <section>
                    <h3 className="text-lg font-semibold mb-3">How to Play</h3>
                    <div className="space-y-2">
                        <p><strong>Study the shape:</strong> Each puzzle shows the outline of a Norwegian fjord</p>
                        <p><strong>Make a guess:</strong> Type a fjord name and select from the autocomplete dropdown</p>
                        <p><strong>Use the clues:</strong> After each wrong guess, you'll see distance and direction to the correct fjord</p>
                        <p><strong>Triangulate:</strong> Use multiple guesses to narrow down the location</p>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold mb-3">Understanding Feedback</h3>
                    <div className="space-y-2">
                        <p><strong>Distance:</strong> How many kilometers your guess is from the correct fjord</p>
                        <p><strong>Direction:</strong> Arrow pointing from your guess toward the correct fjord</p>
                        <p><strong>Proximity:</strong> Percentage showing how close you are (100% = correct)</p>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold mb-3">Example</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="mb-2"><strong>Guess:</strong> "Geirangerfjord"</p>
                        <p className="mb-2"><strong>Result:</strong> 127 km ↗️ 45%</p>
                        <p className="text-sm text-gray-600">
                            This means the correct fjord is 127 kilometers northeast of Geirangerfjord,
                            and you're 45% of the way there in terms of proximity.
                        </p>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold mb-3">Weekly Difficulty</h3>
                    <div className="space-y-2">
                        <p><strong>Monday-Tuesday:</strong> Famous fjords (Geirangerfjord, Sognefjord)</p>
                        <p><strong>Wednesday-Thursday:</strong> Regional fjords (well-known within Norway)</p>
                        <p><strong>Friday-Sunday:</strong> Mixed difficulty with local and lesser-known fjords</p>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold mb-3">Tips for Success</h3>
                    <div className="space-y-2">
                        <p><strong>Start broad:</strong> Guess famous fjords to get your bearings</p>
                        <p><strong>Use geography:</strong> Norway runs north-south, so direction arrows help narrow regions</p>
                        <p><strong>Learn the map:</strong> Familiarize yourself with major Norwegian regions</p>
                        <p><strong>Shape matters:</strong> Study the outline - some fjords have very distinctive shapes</p>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-semibold mb-3">Winning</h3>
                    <p>Guess correctly within 6 attempts to win! Your stats track your streak and success rate. Share your results with an emoji pattern showing your guessing efficiency.</p>
                </section>

            </div>
        </div>
    )
}