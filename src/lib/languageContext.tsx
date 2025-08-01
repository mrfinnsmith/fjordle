'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language } from '@/types/game'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('no')

    useEffect(() => {
        const saved = localStorage.getItem('fjordle-language') as Language
        if (saved && (saved === 'no' || saved === 'en')) {
            setLanguageState(saved)
        }
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem('fjordle-language', lang)
    }

    const t = (key: string): string => {
        const translations = {
            no: {
                // Header
                'past_fjordles': 'Tidligere Fjordle',
                'about': 'Om',
                'how_to_play': 'Hvordan spille',
                'privacy': 'Personvern',
                'no_puzzle_today': 'Ingen gåte tilgjengelig i dag',
                'no_puzzle_message': 'Kom tilbake senere for dagens gåte!',
                'game_description': 'Gjett den norske fjorden ut fra omrisset!',

                // Game
                'guesses': 'GJETNINGER',
                'enter_fjord_name': 'Skriv inn fjordnavn...',
                'loading': 'Laster...',
                'play': 'Spill',

                // Results Modal
                'congratulations': 'Gratulerer!',
                'next_time': 'Neste gang!',
                'the_answer_was': 'Svaret var:',
                'played': 'Spilt',
                'win_percent': 'Vinn %',
                'current_streak': 'Nåværende rekke',
                'max_streak': 'Maks rekke',
                'share_results': 'Del resultatet ditt',
                'copied': 'Kopiert!',

                // Past Puzzles Page
                'back_to_today': 'Tilbake til dagens Fjordle',
                'loading_past_puzzles': 'Laster tidligere puslespill...',
                'error': 'Feil',
                'no_past_puzzles': 'Ingen tidligere puslespill tilgjengelig ennå.',
                'fjordle_number': 'Fjordle #',

                // About Page
                'about_title': 'Om',
                'about_created': 'Fjordle ble laget med kjærlighet for norsk geografi av',
                'about_inspired': 'Inspirert av den karakteristiske skjønnheten til norske fjorder, utfordrer dette daglige puslespillet spillere til å identifisere fjorder ut fra deres unike omriss ved hjelp av avstands- og retningsledetråder.',
                'about_collaborate': 'Ønsker du å samarbeide om puslespill eller har forslag? Ta kontakt via',
                'about_platforms': 'mine nettplattformer',

                // How to Play Page
                'how_to_play_title': 'Hvordan spille',
                'goal_title': 'Målet',
                'goal_text': 'Gjett den norske fjorden ut fra dens karakteristiske omriss på 6 forsøk eller færre.',
                'how_to_play_section': 'Hvordan spille',
                'study_shape': 'Studer formen:',
                'study_shape_text': 'Hvert puslespill viser omrisset av en norsk fjord',
                'make_guess': 'Gjett:',
                'make_guess_text': 'Skriv inn et fjordnavn og velg fra rullegardinmenyen',
                'use_clues': 'Bruk ledetrådene:',
                'use_clues_text': 'Etter hvert feil gjett får du se avstand og retning til riktig fjord',
                'triangulate': 'Triangulér:',
                'triangulate_text': 'Bruk flere gjett for å innsnevre plasseringen',
                'feedback_title': 'Forstå tilbakemelding',
                'distance': 'Avstand:',
                'distance_text': 'Hvor mange kilometer ditt gjett er fra riktig fjord',
                'direction': 'Retning:',
                'direction_text': 'Pil som peker fra ditt gjett mot riktig fjord',
                'proximity': 'Nærhet:',
                'proximity_text': 'Prosent som viser hvor nær du er (100% = riktig)',
                'example_title': 'Eksempel',
                'example_guess': 'Gjett:',
                'example_result': 'Resultat:',
                'example_explanation': 'Dette betyr at riktig fjord er 127 kilometer nordøst for Geirangerfjord, og du er 45% på vei i form av nærhet.',
                'weekly_difficulty': 'Ukentlig vanskelighetsgrad',
                'monday_tuesday': 'Mandag-tirsdag:',
                'monday_tuesday_text': 'Kjente fjorder (Geirangerfjord, Sognefjord)',
                'wednesday_thursday': 'Onsdag-torsdag:',
                'wednesday_thursday_text': 'Regionale fjorder (velkjente i Norge)',
                'friday_sunday': 'Fredag-søndag:',
                'friday_sunday_text': 'Blandet vanskelighetsgrad med lokale og mindre kjente fjorder',
                'tips_title': 'Tips for suksess',
                'start_broad': 'Start bredt:',
                'start_broad_text': 'Gjett kjente fjorder for å orientere deg',
                'use_geography': 'Bruk geografi:',
                'use_geography_text': 'Norge går nord-sør, så retningspiler hjelper til å innsnevre regioner',
                'learn_map': 'Lær kartet:',
                'learn_map_text': 'Gjør deg kjent med store norske regioner',
                'shape_matters': 'Formen betyr noe:',
                'shape_matters_text': 'Studer omrisset - noen fjorder har veldig karakteristiske former',
                'winning_title': 'Å vinne',
                'winning_text': 'Gjett riktig innen 6 forsøk for å vinne! Statistikken din sporer rekken og suksessraten din. Del resultatene dine med et emojimønster som viser gjetteeffektiviteten din.',

                // Privacy Page
                'privacy_title': 'Personvernerklæring',
                'last_updated': 'Sist oppdatert:',
                'overview_title': 'Oversikt',
                'overview_text': 'Fjordle er et daglig norsk fjord-puslespill laget av Finn Smith som et morsomt sideprosjekt. Denne personvernerklæringen forklarer hvordan vi håndterer informasjonen din.',
                'info_collect_title': 'Informasjon vi samler inn',
                'analytics_data': 'Analysedata',
                'analytics_text': 'Vi bruker Google Analytics for å forstå hvordan folk bruker Fjordle. Denne tjenesten kan samle inn:',
                'pages_visit': 'Sider du besøker',
                'time_spent': 'Tid brukt på nettstedet',
                'general_location': 'Din generelle plassering (land/region)',
                'device_browser': 'Enhet og nettleserinformasjon',
                'how_found': 'Hvordan du fant nettstedet vårt',
                'mixpanel_text': 'Vi kan også legge til Mixpanel-analyser i fremtiden for lignende bruksinnsikter.',
                'game_data': 'Spilldata',
                'game_data_text': 'Vi lagrer anonym spillinformasjon:',
                'guesses_sessions': 'Dine gjett og spilløkter (ingen personlig identifikasjon)',
                'stats_local': 'Spillstatistikk lagret lokalt kun i nettleseren din',
                'info_not_collect_title': 'Informasjon vi ikke samler inn',
                'no_names': 'Navn, e-postadresser eller kontaktinformasjon',
                'no_accounts': 'Personlige kontoer eller profiler',
                'no_location': 'Posisjonsdata utover generell analyse',
                'no_personal': 'All informasjon som identifiserer deg personlig',
                'how_use_title': 'Hvordan vi bruker informasjon',
                'improve_experience': 'Forbedre spillopplevelsen',
                'understand_challenging': 'Forstå hvilke fjorder som er mest utfordrende',
                'monitor_performance': 'Overvåke nettstedets ytelse og bruksmønstre',
                'data_storage_title': 'Datalagring',
                'progress_local': 'Spillfremdrift og statistikk lagres lokalt i nettleseren din',
                'anonymous_secure': 'Anonym spilldata lagres sikkert på våre servere',
                'no_sell': 'Vi selger ikke eller deler informasjonen din med tredjeparter (unntatt analysetjenester)',
                'choices_title': 'Dine valg',
                'clear_browser': 'Du kan slette nettleserdata for å tilbakestille spillstatistikken din',
                'disable_analytics': 'Du kan deaktivere analyser ved å bruke nettleserens personverninnstillinger eller annonseblokkere',
                'works_without_cookies': 'Spillet fungerer uten informasjonskapsler (selv om analyser kan være begrenset)',
                'changes_policy_title': 'Endringer i denne policyen',
                'changes_policy_text': 'Vi kan oppdatere denne personvernerklæringen når vi legger til nye funksjoner. Sjekk tilbake av og til for oppdateringer.',
                'contact_title': 'Kontakt',
                'contact_text': 'For spørsmål om denne personvernerklæringen, besøk',
                'contact_info': 'for å finne kontaktinformasjon.',
                'independent_project': 'Fjordle er et uavhengig prosjekt laget for pedagogisk underholdning om norsk geografi.',

                // Metadata
                'site_title': 'Fjordle - Daglig fjordpuslespill',
                'site_description': 'Daglig fjordpuslespill. Gjett fjorden ut fra omrisset. Nytt puslespill hver dag med norske fjorder.',
                'site_keywords': 'fjordpuslespill, norge geografi, daglig puslespill, norske fjorder, puslespill, geografi, fjordle'
            },
            en: {
                // Header
                'past_fjordles': 'Past Fjordles',
                'about': 'About',
                'how_to_play': 'How to Play',
                'privacy': 'Privacy',
                'no_puzzle_today': 'No puzzle available today',
                'no_puzzle_message': 'Please check back later for today\'s puzzle!',
                'game_description': 'Guess the Norwegian fjord from its outline!',

                // Game
                'guesses': 'GUESSES',
                'enter_fjord_name': 'Enter fjord name...',
                'loading': 'Loading...',
                'play': 'Play',

                // Results Modal
                'congratulations': 'Congratulations!',
                'next_time': 'Next Time!',
                'the_answer_was': 'The answer was:',
                'played': 'Played',
                'win_percent': 'Win %',
                'current_streak': 'Current Streak',
                'max_streak': 'Max Streak',
                'share_results': 'Share Your Results',
                'copied': 'Copied!',

                // Past Puzzles Page
                'back_to_today': 'Back to Today\'s Fjordle',
                'loading_past_puzzles': 'Loading past puzzles...',
                'error': 'Error',
                'no_past_puzzles': 'No past puzzles available yet.',
                'fjordle_number': 'Fjordle #',

                // About Page
                'about_title': 'About',
                'about_created': 'Fjordle was created with love for Norwegian geography by',
                'about_inspired': 'Inspired by the distinctive beauty of Norwegian fjords, this daily puzzle challenges players to identify fjords from their unique outline shapes using distance and direction clues.',
                'about_collaborate': 'Want to collaborate on puzzles or have suggestions? Reach out via any of',
                'about_platforms': 'my online platforms',

                // How to Play Page
                'how_to_play_title': 'How to Play',
                'goal_title': 'The Goal',
                'goal_text': 'Guess the Norwegian fjord from its distinctive outline shape in 6 attempts or fewer.',
                'how_to_play_section': 'How to Play',
                'study_shape': 'Study the shape:',
                'study_shape_text': 'Each puzzle shows the outline of a Norwegian fjord',
                'make_guess': 'Make a guess:',
                'make_guess_text': 'Type a fjord name and select from the autocomplete dropdown',
                'use_clues': 'Use the clues:',
                'use_clues_text': 'After each wrong guess, you\'ll see distance and direction to the correct fjord',
                'triangulate': 'Triangulate:',
                'triangulate_text': 'Use multiple guesses to narrow down the location',
                'feedback_title': 'Understanding Feedback',
                'distance': 'Distance:',
                'distance_text': 'How many kilometers your guess is from the correct fjord',
                'direction': 'Direction:',
                'direction_text': 'Arrow pointing from your guess toward the correct fjord',
                'proximity': 'Proximity:',
                'proximity_text': 'Percentage showing how close you are (100% = correct)',
                'example_title': 'Example',
                'example_guess': 'Guess:',
                'example_result': 'Result:',
                'example_explanation': 'This means the correct fjord is 127 kilometers northeast of Geirangerfjord, and you\'re 45% of the way there in terms of proximity.',
                'weekly_difficulty': 'Weekly Difficulty',
                'monday_tuesday': 'Monday-Tuesday:',
                'monday_tuesday_text': 'Famous fjords (Geirangerfjord, Sognefjord)',
                'wednesday_thursday': 'Wednesday-Thursday:',
                'wednesday_thursday_text': 'Regional fjords (well-known within Norway)',
                'friday_sunday': 'Friday-Sunday:',
                'friday_sunday_text': 'Mixed difficulty with local and lesser-known fjords',
                'tips_title': 'Tips for Success',
                'start_broad': 'Start broad:',
                'start_broad_text': 'Guess famous fjords to get your bearings',
                'use_geography': 'Use geography:',
                'use_geography_text': 'Norway runs north-south, so direction arrows help narrow regions',
                'learn_map': 'Learn the map:',
                'learn_map_text': 'Familiarize yourself with major Norwegian regions',
                'shape_matters': 'Shape matters:',
                'shape_matters_text': 'Study the outline - some fjords have very distinctive shapes',
                'winning_title': 'Winning',
                'winning_text': 'Guess correctly within 6 attempts to win! Your stats track your streak and success rate. Share your results with an emoji pattern showing your guessing efficiency.',

                // Privacy Page
                'privacy_title': 'Privacy Policy',
                'last_updated': 'Last updated:',
                'overview_title': 'Overview',
                'overview_text': 'Fjordle is a daily Norwegian fjord puzzle game created by Finn Smith as a fun side project. This privacy policy explains how we handle your information.',
                'info_collect_title': 'Information We Collect',
                'analytics_data': 'Analytics Data',
                'analytics_text': 'We use Google Analytics to understand how people use Fjordle. This service may collect:',
                'pages_visit': 'Pages you visit',
                'time_spent': 'Time spent on the site',
                'general_location': 'Your general location (country/region)',
                'device_browser': 'Device and browser information',
                'how_found': 'How you found our site',
                'mixpanel_text': 'We may also add Mixpanel analytics in the future for similar usage insights.',
                'game_data': 'Game Data',
                'game_data_text': 'We store anonymous game information:',
                'guesses_sessions': 'Your guesses and game sessions (no personal identification)',
                'stats_local': 'Game statistics stored locally in your browser only',
                'info_not_collect_title': 'Information We Don\'t Collect',
                'no_names': 'Names, email addresses, or contact information',
                'no_accounts': 'Personal accounts or profiles',
                'no_location': 'Location data beyond general analytics',
                'no_personal': 'Any information that identifies you personally',
                'how_use_title': 'How We Use Information',
                'improve_experience': 'Improve the game experience',
                'understand_challenging': 'Understand which fjords are most challenging',
                'monitor_performance': 'Monitor site performance and usage patterns',
                'data_storage_title': 'Data Storage',
                'progress_local': 'Game progress and statistics are stored locally in your browser',
                'anonymous_secure': 'Anonymous game data is stored securely on our servers',
                'no_sell': 'We don\'t sell or share your information with third parties (except analytics services)',
                'choices_title': 'Your Choices',
                'clear_browser': 'You can clear your browser data to reset your game statistics',
                'disable_analytics': 'You can disable analytics by using browser privacy settings or ad blockers',
                'works_without_cookies': 'The game works without cookies (though analytics may be limited)',
                'changes_policy_title': 'Changes to This Policy',
                'changes_policy_text': 'We may update this privacy policy as we add new features. Check back occasionally for updates.',
                'contact_title': 'Contact',
                'contact_text': 'For questions about this privacy policy, visit',
                'contact_info': 'to find contact information.',
                'independent_project': 'Fjordle is an independent project created for educational entertainment about Norwegian geography.',

                // Metadata
                'site_title': 'Fjordle - Daily Norwegian Fjord Puzzle',
                'site_description': 'Daily Norwegian fjord puzzle game. Guess the fjord from its distinctive outline shape. New puzzle every day featuring Norwegian geography.',
                'site_keywords': 'fjord puzzle, norway geography, daily puzzle, fjord game, norwegian fjords, puzzle, game, geography, fjordle'
            }
        }

        return (translations[language] as Record<string, string>)?.[key] || (translations.en as Record<string, string>)[key] || key
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}