'use client'
import * as si from 'simple-icons'

// Maps each vault service to a brand mark.
//  - `slug`: a simple-icons export name (e.g. 'siStripe') when the brand exists in the set.
//  - `fallback`: a {letter, color} monogram for brands NOT in simple-icons
//    (Slack was removed at the brand's request; GoHighLevel & Follow Up Boss were never added).
// To upgrade a fallback to an official logo later: drop an SVG in /public and point `src` at it.
export interface Brand {
    slug?: keyof typeof si
    src?: string            // optional self-hosted SVG path (e.g. '/logos/slack.svg')
    fallback?: { letter: string; color: string }
}

export const BRANDS: Record<string, Brand> = {
    hubspot_api_key:     { slug: 'siHubspot' },
    telegram_bot_token:  { slug: 'siTelegram' },
    // Not in simple-icons — branded monograms until official SVGs are added.
    slack_bot_token:     { fallback: { letter: 'S', color: '#4A154B' } },
    gohighlevel_api_key: { fallback: { letter: 'HL', color: '#156FFC' } },
    fub_api_key:         { fallback: { letter: 'FB', color: '#0098D4' } },
}

export function BrandIcon({ brand, size = 20 }: { brand?: Brand; size?: number }) {
    if (!brand) return null

    // 1. Self-hosted official SVG (preferred upgrade path)
    if (brand.src) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={brand.src} alt="" width={size} height={size} style={{ display: 'block' }} />
    }

    // 2. simple-icons brand glyph, tinted with the official brand color
    if (brand.slug) {
        const icon = si[brand.slug] as { path: string; hex: string; title: string } | undefined
        if (icon) {
            return (
                <svg
                    role="img"
                    aria-label={icon.title}
                    viewBox="0 0 24 24"
                    width={size}
                    height={size}
                    fill={`#${icon.hex}`}
                    style={{ display: 'block', flexShrink: 0 }}
                >
                    <path d={icon.path} />
                </svg>
            )
        }
    }

    // 3. Branded monogram fallback
    if (brand.fallback) {
        return (
            <span
                style={{
                    width: size, height: size, flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: brand.fallback.color, color: '#fff',
                    borderRadius: size * 0.28,
                    fontSize: size * (brand.fallback.letter.length > 1 ? 0.38 : 0.5),
                    fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em',
                }}
            >
                {brand.fallback.letter}
            </span>
        )
    }

    return null
}
