/**
 * Theme families ported from archive/Style_Vision_Board_v2.html
 * Typed data only — no JSX. Applied via ThemeProvider.
 */

export type ThemePalette = {
  name: string
  bg: string
  card: string
  header: string
  headerTxt: string
  primary: string
  accent: string
  text: string
  muted: string
  navActive: string
  navActiveTxt: string
  navInactive: string
  navInactiveTxt: string
  border: string
}

export type ThemeFamily = {
  id: string
  name: string
  dot: string
  vibe: string
  fontPrimary: string
  fontSecondary: string
  fontPrimaryName: string
  fontSecondaryName: string
  palettes: ThemePalette[]
}

export const themeFamilies: ThemeFamily[] = [
  {
    id: 'calm-clinical',
    name: 'Calm & Clinical',
    dot: '#2563EB',
    vibe: 'Trustworthy, clean, and professional. Feels like a well-organized SPED office — serious but approachable. Easy on the eyes for long workdays.',
    fontPrimary: "'Poppins', sans-serif",
    fontSecondary: "'Figtree', sans-serif",
    fontPrimaryName: 'Poppins',
    fontSecondaryName: 'Figtree',
    palettes: [
      {
        name: 'Classic Blue',
        bg: '#F0F9FF',
        card: '#FFFFFF',
        header: '#1E3A5F',
        headerTxt: '#FFFFFF',
        primary: '#2563EB',
        accent: '#0EA5E9',
        text: '#1E293B',
        muted: '#64748B',
        navActive: '#2563EB',
        navActiveTxt: '#FFFFFF',
        navInactive: '#E2E8F0',
        navInactiveTxt: '#64748B',
        border: '#E2E8F0',
      },
      {
        name: 'Slate & Silver',
        bg: '#F8FAFC',
        card: '#FFFFFF',
        header: '#1E293B',
        headerTxt: '#FFFFFF',
        primary: '#475569',
        accent: '#94A3B8',
        text: '#0F172A',
        muted: '#64748B',
        navActive: '#475569',
        navActiveTxt: '#FFFFFF',
        navInactive: '#F1F5F9',
        navInactiveTxt: '#475569',
        border: '#CBD5E1',
      },
      {
        name: 'Teal Clinic',
        bg: '#ECFEFF',
        card: '#FFFFFF',
        header: '#164E63',
        headerTxt: '#FFFFFF',
        primary: '#0891B2',
        accent: '#22D3EE',
        text: '#0C4A6E',
        muted: '#0891B2',
        navActive: '#0891B2',
        navActiveTxt: '#FFFFFF',
        navInactive: '#CFFAFE',
        navInactiveTxt: '#0E7490',
        border: '#A5F3FC',
      },
      {
        name: 'Sage & Stone',
        bg: '#ECFDF5',
        card: '#FFFFFF',
        header: '#064E3B',
        headerTxt: '#FFFFFF',
        primary: '#059669',
        accent: '#34D399',
        text: '#022C22',
        muted: '#059669',
        navActive: '#059669',
        navActiveTxt: '#FFFFFF',
        navInactive: '#D1FAE5',
        navInactiveTxt: '#065F46',
        border: '#A7F3D0',
      },
      {
        name: 'Dusty Rose',
        bg: '#FFF1F2',
        card: '#FFFFFF',
        header: '#881337',
        headerTxt: '#FFFFFF',
        primary: '#BE185D',
        accent: '#F9A8D4',
        text: '#1E1B1B',
        muted: '#9D174D',
        navActive: '#BE185D',
        navActiveTxt: '#FFFFFF',
        navInactive: '#FCE7F3',
        navInactiveTxt: '#9D174D',
        border: '#FBCFE8',
      },
    ],
  },
  {
    id: 'soft-pastel',
    name: 'Soft Pastel Pro',
    dot: '#A78BFA',
    vibe: 'The SPED sweet spot — cheerful and friendly without being childish. Feels like it was designed specifically for education professionals who care deeply about their students.',
    fontPrimary: "'Poppins', sans-serif",
    fontSecondary: "'Figtree', sans-serif",
    fontPrimaryName: 'Poppins',
    fontSecondaryName: 'Figtree',
    palettes: [
      {
        name: 'Lavender Dream',
        bg: '#F9FAFB',
        card: '#FFFFFF',
        header: 'linear-gradient(135deg,#C4B5FD,#93C5FD)',
        headerTxt: '#1E1B4B',
        primary: '#A78BFA',
        accent: '#34D399',
        text: '#374151',
        muted: '#9CA3AF',
        navActive: '#A78BFA',
        navActiveTxt: '#FFFFFF',
        navInactive: '#EDE9FE',
        navInactiveTxt: '#7C3AED',
        border: '#EDE9FE',
      },
      {
        name: 'Peach Blossom',
        bg: '#FFF7ED',
        card: '#FFFFFF',
        header: 'linear-gradient(135deg,#FED7AA,#FCA5A5)',
        headerTxt: '#7C2D12',
        primary: '#FB923C',
        accent: '#F472B6',
        text: '#431407',
        muted: '#9A3412',
        navActive: '#FB923C',
        navActiveTxt: '#FFFFFF',
        navInactive: '#FFEDD5',
        navInactiveTxt: '#C2410C',
        border: '#FED7AA',
      },
      {
        name: 'Mint Breeze',
        bg: '#ECFDF5',
        card: '#FFFFFF',
        header: 'linear-gradient(135deg,#A7F3D0,#6EE7B7)',
        headerTxt: '#064E3B',
        primary: '#10B981',
        accent: '#818CF8',
        text: '#022C22',
        muted: '#059669',
        navActive: '#10B981',
        navActiveTxt: '#FFFFFF',
        navInactive: '#D1FAE5',
        navInactiveTxt: '#047857',
        border: '#A7F3D0',
      },
      {
        name: 'Rose Garden',
        bg: '#FFF1F2',
        card: '#FFFFFF',
        header: 'linear-gradient(135deg,#FECDD3,#FDA4AF)',
        headerTxt: '#881337',
        primary: '#F43F5E',
        accent: '#C084FC',
        text: '#1E1B1B',
        muted: '#BE123C',
        navActive: '#F43F5E',
        navActiveTxt: '#FFFFFF',
        navInactive: '#FFE4E6',
        navInactiveTxt: '#E11D48',
        border: '#FECDD3',
      },
      {
        name: 'Sky & Cloud',
        bg: '#EFF6FF',
        card: '#FFFFFF',
        header: 'linear-gradient(135deg,#BAE6FD,#93C5FD)',
        headerTxt: '#1E3A5F',
        primary: '#60A5FA',
        accent: '#F9A8D4',
        text: '#1E3A5F',
        muted: '#3B82F6',
        navActive: '#60A5FA',
        navActiveTxt: '#FFFFFF',
        navInactive: '#DBEAFE',
        navInactiveTxt: '#2563EB',
        border: '#BFDBFE',
      },
    ],
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode Elite',
    dot: '#818CF8',
    vibe: 'Sleek, sophisticated, and seriously powerful. For the provider who spends long hours in front of a screen and wants an environment that feels elite. Reduces eye strain and looks incredible.',
    fontPrimary: "'Space Grotesk', sans-serif",
    fontSecondary: "'Figtree', sans-serif",
    fontPrimaryName: 'Space Grotesk',
    fontSecondaryName: 'Figtree',
    palettes: [
      {
        name: 'Indigo Glow',
        bg: '#0F172A',
        card: '#1E293B',
        header: '#020617',
        headerTxt: '#E2E8F0',
        primary: '#818CF8',
        accent: '#38BDF8',
        text: '#F1F5F9',
        muted: '#94A3B8',
        navActive: '#818CF8',
        navActiveTxt: '#FFFFFF',
        navInactive: '#1E293B',
        navInactiveTxt: '#94A3B8',
        border: '#334155',
      },
      {
        name: 'Emerald Night',
        bg: '#0F172A',
        card: '#1E293B',
        header: '#022C22',
        headerTxt: '#D1FAE5',
        primary: '#10B981',
        accent: '#6EE7B7',
        text: '#F0FDF4',
        muted: '#6EE7B7',
        navActive: '#10B981',
        navActiveTxt: '#022C22',
        navInactive: '#1E293B',
        navInactiveTxt: '#6EE7B7',
        border: '#134E4A',
      },
      {
        name: 'Amber Dark',
        bg: '#0F172A',
        card: '#1E293B',
        header: '#1C1002',
        headerTxt: '#FDE68A',
        primary: '#F59E0B',
        accent: '#FDE68A',
        text: '#FFFBEB',
        muted: '#FCD34D',
        navActive: '#F59E0B',
        navActiveTxt: '#1C1002',
        navInactive: '#1E293B',
        navInactiveTxt: '#FCD34D',
        border: '#292524',
      },
      {
        name: 'Rose Noir',
        bg: '#0F172A',
        card: '#1E293B',
        header: '#1A0010',
        headerTxt: '#FFE4E6',
        primary: '#F43F5E',
        accent: '#FDA4AF',
        text: '#FFF1F2',
        muted: '#FDA4AF',
        navActive: '#F43F5E',
        navActiveTxt: '#FFFFFF',
        navInactive: '#1E293B',
        navInactiveTxt: '#FDA4AF',
        border: '#4C0519',
      },
      {
        name: 'Cyan Storm',
        bg: '#0F172A',
        card: '#1E293B',
        header: '#012025',
        headerTxt: '#A5F3FC',
        primary: '#06B6D4',
        accent: '#67E8F9',
        text: '#ECFEFF',
        muted: '#67E8F9',
        navActive: '#06B6D4',
        navActiveTxt: '#012025',
        navInactive: '#1E293B',
        navInactiveTxt: '#67E8F9',
        border: '#164E63',
      },
    ],
  },
]

export const defaultThemeSelection = {
  familyId: 'calm-clinical',
  paletteName: 'Classic Blue',
} as const

export function getPalette(familyId: string, paletteName: string): ThemePalette | undefined {
  const family = themeFamilies.find((f) => f.id === familyId)
  return family?.palettes.find((p) => p.name === paletteName)
}

export function paletteToCssVars(palette: ThemePalette): Record<string, string> {
  return {
    '--bg': palette.bg,
    '--card-bg': palette.card,
    '--text': palette.text,
    '--subtext': palette.muted,
    '--border': palette.border,
    '--accent': palette.primary,
    '--nav-active': palette.navActive,
    '--nav-active-txt': palette.navActiveTxt,
    '--nav-inactive': palette.navInactive,
    '--nav-inactive-txt': palette.navInactiveTxt,
    '--header-bg': palette.header,
    '--header-txt': palette.headerTxt,
  }
}
