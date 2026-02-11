import Script from 'next/script'

export const metadata = {
    title: 'Spørsmål og svar - Fjordle',
    description: 'Ofte stilte spørsmål om Fjordle. Få svar på vanlige spørsmål om det daglige norske fjord puslespillet.',
    keywords: 'fjordle faq, spørsmål svar, fjord spill hjelp, hvordan spille fjordle'
}

const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
        {
            "@type": "Question",
            "name": "Hva er Fjordle?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Fjordle er et daglig puslespill hvor du gjetter norske fjorder ut fra deres karakteristiske omriss. Du har 6 forsøk på å identifisere riktig fjord ved hjelp av avstands- og retningsledetråder."
            }
        },
        {
            "@type": "Question",
            "name": "Hva betyr pilene og avstandene?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Pilen viser retningen fra ditt gjett til riktig fjord. Avstanden forteller deg hvor mange kilometer fra hverandre de er. For eksempel, hvis du gjetter Geirangerfjord og ser 127km ↗️, må du se etter fjorder omtrent 127 kilometer nordøst for Geirangerfjord."
            }
        },
        {
            "@type": "Question",
            "name": "Hva er nærhetsprosenten?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Nærhetsprosenten er en annen måte å vise avstand på. Hvis gjettet ditt er på motsatt side av Norge fra riktig fjord, får du 0%. Hvis du gjetter riktig fjord, får du 100%. Denne prosenten hjelper deg med å vurdere hvor nær du er svaret."
            }
        },
        {
            "@type": "Question",
            "name": "Kan jeg spille tidligere puslespill?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Ja! Du finner alle tidligere puslespill på tidligere puslespill-siden."
            }
        },
        {
            "@type": "Question",
            "name": "Hvordan deler jeg resultatene mine?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Vi bruker firkanter for å visuelt representere nærhetsprosenten av gjettet ditt. Vi runder nærhetsprosenten ned til nærmeste 10, og representerer resultatet med grønne (🟩 = 20%) og/eller gule (🟨 = 10%) firkanter. Siden vi bruker totalt 5 firkanter, fyller vi resten med svarte firkanter (⬛). Så 72% blir representert som 🟩🟩🟩🟨⬛"
            }
        },
        {
            "@type": "Question",
            "name": "Hvor kommer fjorddataene fra?",
            "acceptedAnswer": {
                "@type": "Answer",
                "text": "Fjorddataene kommer fra Fjordkatalogen, som er en offisiell database fra Miljødirektoratet."
            }
        }
    ]
}

export default function FAQLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Script
                id="faq-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            {children}
        </>
    )
}