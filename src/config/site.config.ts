/**
 * SITE CONTENT CONFIGURATION
 * ---------------------------------------------------------------------------
 * Every piece of copy, pricing and contact detail on the site lives here.
 * Edit this file to update the website — no component changes required.
 *
 * The service menu below is transcribed from the salon's own printed
 * catalogue (`images n videos/price catologe/Catalouge.pdf`), including its
 * two-column Male/Female and Regular/Premium pricing.
 *
 * Items marked `TODO_CONFIRM` were NOT in the catalogue or the reference media
 * and are placeholders. Replace them with the salon's real details.
 */

export const BRAND = {
  name: 'Cut N Curl',
  /** Wordmark split so the display font can letterspace each part. */
  wordmark: ['Cut', 'N', 'Curl'] as const,
  tagline: 'Salon & Aesthetic',
  /** The circular badge reads "Cut 'N' Curl · Makeup | Nails | Hair". */
  descriptor: 'Unisex Salon',
  disciplines: ['Makeup', 'Nails', 'Hair'] as const,
  heroLine: 'Where Beauty Meets Art',
  established: 2016,
  /** Spelled "Rjnish" in the salon's own catalogue and vision statement. */
  founder: 'Rjnish',
  partner: 'L’Oréal Professionnel Paris',
  logo: {
    badge: '/media/logo-badge.png',
    badgeSmall: '/media/logo-badge-sm.png',
    /**
     * The salon's own logo film, used by the opening title sequence.
     *
     * Transcoded from `images n videos/intro.mp4`, which is a 4K portrait
     * HEVC/HDR phone capture that most browsers cannot decode at all. The
     * flat grey field it was shot on is keyed out and replaced with a warm
     * vignette, and it is cropped square around the badge. See the README.
     */
    film: '/media/intro-badge.mp4',
    filmPoster: '/media/intro-badge-poster.jpg',
    /**
     * The same film as an animated image, for a phone that refuses to play
     * video at all (Low Power Mode). Images still animate there. Fetched only
     * once a browser has actually refused. See `tools/build-fallbacks.py`.
     */
    filmAnim: { avif: '/media/intro-badge.avif', webp: '/media/intro-badge.webp' },
  },
} as const

/** Transcribed from the Vision Statement on the catalogue's cover page. */
export const VISION_STATEMENT =
  'Established in the year 2016, Cut N Curl is a luxury salon started by Rjnish ' +
  'with a team of highly trained and experienced stylists and beauticians. The salon ' +
  'is known for its exceptional quality of service. We provide a range of highly ' +
  'trendy services — from haircuts to complete skin solutions and much more. ' +
  'Together, we aim to deliver consistently superior customer service with a happy, ' +
  'relentless attitude, while staying within an affordable budget.'

export const STORY_POINTS = [
  {
    k: '2016',
    title: 'Where it started',
    body:
      'Cut N Curl opened its doors in Model Town, Rewari with one idea — that a small-city ' +
      'salon could hold itself to metropolitan standards without metropolitan pricing.',
  },
  {
    k: 'Craft',
    title: 'Fifteen pairs of hands',
    body:
      'Colourists, hair masters, makeup and nail artists, beauticians and a pedicurist — ' +
      'fifteen in all, working with L’Oréal Professionnel colour and care.',
  },
  {
    k: 'Hygiene',
    title: 'Sterilised, every single time',
    body:
      'Fresh towels for every client, sanitised tools between appointments and stations wiped ' +
      'down after every sitting. Hygiene here is a protocol, not a promise.',
  },
] as const

/* ------------------------------------------------------------- SERVICES */

/**
 * A price is either an amount in rupees, a pre-formatted string for the few
 * entries the catalogue prints as a range, or null where a group's column
 * does not apply to that service.
 */
export type Price = number | string | null

export type Service = {
  name: string
  /** Small qualifier printed under the name in the catalogue. */
  note?: string
  /** Used when the group has no columns. */
  price?: Price
  /** One value per column, in the order given by `ServiceGroup.columns`. */
  prices?: [Price, Price]
  /**
   * Single price that applies regardless of column. The catalogue prints these
   * aligned under the second column, but they are flat rates — see README.
   */
  flat?: Price
  /** Catalogue prints these with a trailing "+". */
  from?: boolean
}

export type ServiceGroup = {
  title: string
  /** Column headers when the group prices two ways. */
  columns?: [string, string]
  services: Service[]
}

export type ServiceCategory = {
  id: string
  title: string
  blurb: string
  groups: ServiceGroup[]
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'hair',
    title: 'Hair',
    blurb: 'Cut, colour, texture and care — priced for men and women.',
    groups: [
      {
        title: 'Hair Cut & Grooming',
        columns: ['Male', 'Female'],
        services: [
          { name: 'Hair Cut Professional', prices: [100, 400] },
          { name: 'Hair Cut Advance', prices: [150, 500] },
          { name: 'Kids Haircut Basic', prices: [100, 250] },
          { name: 'Kids Haircut Advance', prices: [200, 300] },
          { name: 'Beard Shave / Trim', prices: [50, null] },
          { name: 'Beard Advance', prices: [100, null] },
          { name: 'Beard Spa', prices: [400, null] },
          { name: 'Shave + Instant Glow Cleanup', prices: [500, null] },
        ],
      },
      {
        title: 'Hair Care & Styling',
        columns: ['Male', 'Female'],
        services: [
          { name: 'Blow Dry (Straight)', prices: [50, 250] },
          { name: 'Blow Dry (Styling)', prices: [100, 300] },
          { name: 'Hairwash & Conditioning', prices: [100, 300] },
          { name: 'Hairwash, Conditioning & Blow Dry', prices: [150, 500] },
          { name: 'Hairwash & Conditioning (Premium)', prices: [200, 600] },
          { name: 'Hairwash, Conditioning & Blow Dry (Premium)', prices: [200, 700] },
          { name: 'Ironing', prices: [null, 500] },
          { name: 'Tonging', prices: [null, 500] },
          { name: 'Crimping', prices: [null, 600] },
          { name: 'Hair Do’s / Styling', prices: [null, 1000] },
        ],
      },
      {
        title: 'Colour & Texture',
        columns: ['Regular', 'Premium'],
        services: [
          { name: 'Root Touch-Up', prices: [800, 1300] },
          { name: 'Root Touch-Up Without Ammonia', prices: [1000, 1450] },
          { name: 'Global Colour', prices: [1500, 3000] },
          { name: 'Global Colour Without Ammonia', prices: [1500, 4000] },
          { name: 'Fashion Colour', prices: [2000, 4500] },
          { name: 'Streaks', note: 'Per streak', prices: [200, 300] },
          { name: 'Beard Colour', prices: [250, '₹300 – ₹400'] },
          { name: 'Rebonding', prices: [2000, 4000] },
          { name: 'Smoothening', prices: [3000, 4000] },
          { name: 'Keratin', prices: [2500, 4500] },
          { name: 'Kera-Smoothening', prices: [5500, 7500] },
          { name: 'Botox', prices: [3500, 6500] },
          { name: 'Nanoplastia', prices: [6000, 9000] },
        ],
      },
      {
        title: 'Hair Spa & Treatments',
        columns: ['Male', 'Female'],
        services: [
          { name: 'Deep Conditioning', prices: [500, 700] },
          { name: 'Nourishment Hair Spa', note: 'L’Oréal', prices: [700, 1150] },
          {
            name: 'Scalp Treatment + Hair Spa',
            note: 'Hairfall, dandruff, oily scalp, dryness',
            prices: [900, 1750],
          },
          {
            name: 'Length / Bond Treatment + Hair Spa',
            note: 'Dryness, breakage',
            prices: [1200, 1950],
          },
          { name: 'Thinning / Volume Treatment + Hair Spa', prices: [1200, 1950] },
          { name: 'Premium Hair Spa', prices: [1500, 2500] },
        ],
      },
      {
        title: 'Head Massage',
        columns: ['Male', 'Female'],
        services: [
          { name: 'Coconut', prices: [150, 250] },
          { name: 'Almond / Olive Oil', prices: [200, 350] },
        ],
      },
    ],
  },

  {
    id: 'nails',
    title: 'Nails',
    blurb: 'Gel, acrylic and hand-painted art at the nail bar.',
    groups: [
      {
        title: 'Nail Art',
        services: [
          { name: 'Plain Gel Polish', note: 'Natural nails', price: 500 },
          { name: 'Gel Polish + Nail Art', note: 'Natural nails', price: 600 },
          { name: 'Temporary Extensions', note: 'Plain gel polish only', price: 800 },
          { name: 'Temporary Extensions', note: 'Gel polish + nail art', price: 1000 },
        ],
      },
      {
        title: 'Permanent Extensions',
        services: [
          { name: 'Gel Extensions', note: 'Plain gel polish', price: 1200 },
          { name: 'Gel Extensions', note: 'Gel polish + nail art', price: 1500 },
          { name: 'Acrylic Extensions', note: 'Plain gel polish', price: 1800 },
          { name: 'Acrylic Extensions', note: 'Gel polish + nail art', price: 2000 },
        ],
      },
      {
        title: 'Hands & Feet',
        services: [
          { name: 'Regular Manicure', price: 400 },
          { name: 'Advanced Manicure', price: 600 },
          { name: 'Diamond Manicure', price: 800 },
          { name: 'Premium Manicure', price: 1200 },
          { name: 'Regular Pedicure', price: 500 },
          { name: 'Advanced Pedicure', price: 700 },
          { name: 'Diamond Pedicure', price: 1000 },
          { name: 'Premium Pedicure', price: 1500 },
          { name: 'Hand Spa', note: '30 mins', price: 600 },
          { name: 'Foot Spa', note: '45 mins', price: 700 },
          { name: 'Foot Massage', note: '15 mins', price: 300 },
          { name: 'Cut & File', note: 'Hands or feet', price: 100 },
          { name: 'Cut, File & Polish', note: 'Hands or feet', price: 200 },
          { name: 'Change of Polish', note: 'Hands or feet', price: 150 },
          { name: 'French Nails', note: 'Hands or feet', price: 200 },
          { name: 'Bleach / De-Tan Pack', price: 400 },
        ],
      },
      {
        title: 'Other Services',
        services: [
          { name: 'Gel Polish Feet', price: 500 },
          { name: 'Refilling Extensions', price: 800 },
          { name: 'Gel Polish Removal', price: 300 },
          { name: 'Gel Extensions Removal', price: 500 },
          { name: 'Acrylic Extensions Removal', price: 700 },
          { name: 'Accessory Work', note: 'Add on', price: 100 },
        ],
      },
    ],
  },

  {
    id: 'makeup',
    title: 'Makeup',
    blurb: 'Party, engagement and bridal — finished under daylight-balanced mirrors.',
    groups: [
      {
        title: 'Party Makeup',
        services: [
          { name: 'Basic', price: 2500, from: true },
          { name: 'HD', price: 3500, from: true },
          { name: 'Airbrush', price: 5000, from: true },
        ],
      },
      {
        title: 'Engagement / Reception Makeup',
        services: [
          { name: 'Basic', price: 4500 },
          { name: 'HD', price: 5000 },
          { name: 'Airbrush', price: 10000 },
        ],
      },
      {
        title: 'Bridal Makeup',
        services: [
          { name: 'Basic', price: 9000 },
          { name: 'HD', price: 15000 },
          { name: 'Airbrush', price: 18000 },
        ],
      },
      {
        title: 'Pre-Bridal',
        services: [
          { name: 'Regular Pre-Bridal', price: 8500 },
          { name: 'Premium Pre-Bridal', price: 20000 },
        ],
      },
      {
        title: 'Groom',
        services: [
          { name: 'Classic Package', price: 5100 },
          { name: 'Superior Package', price: 7100 },
          { name: 'Luxury Package', price: 9100 },
        ],
      },
      {
        title: 'Eye Makeup & Draping',
        services: [
          { name: 'Eye Makeup — Basic', price: 600 },
          { name: 'Eye Makeup — Advance', price: 1000 },
          { name: 'Saree Draping', price: 400 },
        ],
      },
    ],
  },

  {
    id: 'skin',
    title: 'Skin & Body',
    blurb: 'Facials, clean-ups, de-tan and waxing in a private treatment room.',
    groups: [
      {
        title: 'Facial',
        services: [
          { name: 'Instant Glow Facial', price: 900 },
          { name: 'Fruit Facial', price: 1000 },
          { name: 'Gold Facial', price: 1500 },
          { name: 'D-Tan Facial', price: 2150 },
          { name: 'Anti-Oxidant Facial', price: 2400 },
          { name: 'Hydra Facial', price: 2500 },
          { name: 'Sensitive Skin Facial', price: 2700 },
          { name: 'Anti-Acne Facial', price: 2900 },
          { name: 'Anti-Pigmentation Facial', price: 3000 },
          { name: 'Anti-Ageing Facial', price: 3150 },
          { name: 'Lifting Facial', price: 3300 },
          { name: 'Brightening Facial', price: 3800 },
          { name: 'Bridal Facial', price: 4500 },
          { name: 'Hydra Facial Premium', price: 5000 },
          { name: 'Sheet Mask', price: 800 },
          { name: 'Rubber Mask', price: 1000 },
          { name: 'Peel-Off Mask', price: 1200 },
        ],
      },
      {
        title: 'Cleanup',
        services: [
          { name: 'Essential Cleanup', price: 500 },
          { name: 'Instant Glow Cleanup', price: 800 },
          { name: 'Premium Cleanup', price: 1500 },
        ],
      },
      {
        title: 'Body Care',
        services: [
          { name: 'Body Shine Polishing', price: 3500 },
          { name: 'De-Tan Body Polishing', price: 5000 },
        ],
      },
      {
        title: 'Bleach / D-Tan',
        columns: ['Regular', 'Premium'],
        services: [
          { name: 'Face', prices: [350, 500] },
          { name: 'Face & Neck', prices: [400, 600] },
          { name: 'Half Arms', prices: [350, 500] },
          { name: 'Full Arms', prices: [500, 700] },
          { name: 'Half Legs', prices: [400, 600] },
          { name: 'Full Legs', prices: [600, 900] },
          { name: 'Half Front / Half Back', prices: [500, 700] },
          { name: 'Front / Back', prices: [800, 1200] },
          { name: 'Full Body', prices: [2000, 3000] },
        ],
      },
      {
        title: 'Waxing',
        columns: ['Regular', 'Premium'],
        services: [
          { name: 'Upper Lip / Lower Lip', flat: 100 },
          { name: 'Chin Wax', flat: 100 },
          { name: 'Side Locks', flat: 120 },
          { name: 'Face', flat: 300 },
          { name: 'Half Arms', prices: [250, 400] },
          { name: 'Full Arms', prices: [450, 600] },
          { name: 'Under Arms', prices: [120, 200] },
          { name: 'Half Legs', prices: [450, 600] },
          { name: 'Full Legs', prices: [600, 800] },
          { name: 'Front / Back', prices: [600, 900] },
          { name: 'Full Body', note: 'Bikini wax not included', prices: [2200, 3000] },
          { name: 'Bikini Wax', flat: 1200 },
        ],
      },
      {
        title: 'Threading',
        services: [
          { name: 'Eyebrows', price: 40 },
          { name: 'Upper Lips', price: 30 },
          { name: 'Chin', price: 30 },
          { name: 'Forehead', price: 30 },
          { name: 'Side Locks', price: 40 },
          { name: 'Full Face', price: 150 },
        ],
      },
    ],
  },
]

/** Printed at the foot of every page of the salon's catalogue. */
export const PRICING_NOTE =
  'Packages, special offers and discounts cannot be clubbed with any membership.'

/* ----------------------------------------------------------------- TEAM */

export type TeamMember = {
  name: string
  role: string
  /** Grouping used for the team filter. */
  discipline: 'Hair' | 'Makeup & Nails' | 'Skin' | 'Front of House'
  bio?: string
  /** Optional headshot in /public/media. Falls back to a monogram tile. */
  photo?: string
}

export const TEAM: TeamMember[] = [
  {
    name: 'Rjnish',
    role: 'Founder',
    discipline: 'Front of House',
    bio: 'Opened Cut N Curl in 2016 and still runs the floor.',
  },
  { name: 'Gulfam', role: 'Senior Hair Colorist', discipline: 'Hair' },
  { name: 'Yakub', role: 'Hair Master', discipline: 'Hair' },
  { name: 'Shahzan', role: 'Hairdresser', discipline: 'Hair' },
  { name: 'Dada', role: 'Hair Artist', discipline: 'Hair' },
  { name: 'Rehan', role: 'Hair Artist', discipline: 'Hair' },
  { name: 'Rehan Raj', role: 'Unisex Hair Artist', discipline: 'Hair' },
  { name: 'Sohil', role: 'Unisex Hair Artist', discipline: 'Hair' },
  { name: 'Mohsin', role: 'Male Hair Artist', discipline: 'Hair' },
  { name: 'Vakil', role: 'Male Hair Artist', discipline: 'Hair' },
  { name: 'Anju', role: 'Aesthetic Makeup & Nail Artist', discipline: 'Makeup & Nails' },
  { name: 'Nandani', role: 'Makeup Artist', discipline: 'Makeup & Nails' },
  { name: 'Nisha', role: 'Beautician', discipline: 'Skin' },
  { name: 'Chandan', role: 'Pedicurist', discipline: 'Skin' },
  { name: 'Prachi', role: 'Management', discipline: 'Front of House' },
]

/* -------------------------------------------------------------- GALLERY */

export type GalleryItem = {
  src: string
  alt: string
  width: number
  height: number
  /** The short italic caption on the tile and in the lightbox. */
  caption: string
  /** Which place on the wall this photograph takes (see `.wall__tile--*`). */
  tile: 'space' | 'makeup' | 'reception' | 'nail' | 'sign' | 'light' | 'wash' | 'gel'
}

/** The wall's own words. */
export const GALLERY_COPY = {
  title: 'Step inside Cut N Curl',
  lede: 'The space, the colours and the little details behind every appointment.',
  closing: 'Like what you see? Come and sit in the chair.',
  cta: 'Book an appointment',
} as const

/*
 * Eight photographs of the real salon, each with its place on the wall. The
 * order here is the order of the lightbox; the grid places each by its
 * `tile`. (The motion-blurred frame of the styling chairs is not used.)
 */
export const GALLERY: GalleryItem[] = [
  { tile: 'space', caption: 'The space', src: '/media/salon-styling-wide.jpg', alt: 'The styling floor at Cut N Curl: backlit oval mirrors, white chairs on gold bases and a marble floor', width: 1920, height: 1004 },
  { tile: 'makeup', caption: 'Makeup room', src: '/media/salon-makeup-room.jpg', alt: 'The makeup room with its backlit mirror, white chairs on gold bases and linear ceiling lights', width: 1100, height: 1956 },
  { tile: 'reception', caption: 'Reception', src: '/media/gallery-reception.jpg', alt: 'The marble reception desk with the gold stag sculpture and shelf of products', width: 900, height: 1216 },
  { tile: 'nail', caption: 'Nail art', src: '/media/gallery-nail-art.jpg', alt: 'The Nail Art wall: white shelves stocked with gel polish bottles', width: 900, height: 1216 },
  { tile: 'sign', caption: 'The sign', src: '/media/gallery-gold-sign.jpg', alt: 'The gold Cut ’N’ Curl unisex salon signage on an ivory wall', width: 900, height: 672 },
  { tile: 'light', caption: 'The light', src: '/media/gallery-ceiling.jpg', alt: 'Recessed linear ceiling lights above a wall with gold inlay', width: 900, height: 1216 },
  { tile: 'wash', caption: 'Wash bay', src: '/media/gallery-wash-loreal.jpg', alt: 'The wash bay with the L’Oréal Professionnel display and backlit product shelf', width: 900, height: 1216 },
  { tile: 'gel', caption: 'Gel colours', src: '/media/gallery-polish.jpg', alt: 'A display of gel polish colours and nail art samples', width: 900, height: 1216 },
]

/* -------------------------------------------------------------- CONTACT */

export const CONTACT = {
  addressLines: ['281/L, Model Town', 'Near Yaduvanshi Hospital', 'Rewari, Haryana 123401'],
  /** Landmark taken from the salon's own Google listing. */
  mapQuery: 'Cut N Curl Unisex Salon, 281/L Model Town, Rewari, Haryana 123401',
  phone: '+91 70158 05946',
  /** Digits only, country code first — used to build the WhatsApp booking link. */
  whatsapp: '917015805946',
  email: 'cutncurlsalonrewari@gmail.com',
  instagram: 'https://www.instagram.com/cut_n_curl_salon_rewari',
  instagramHandle: '@cut_n_curl_salon_rewari',
  /** Open every day, 9:00 AM to 10:00 PM. A `null` pair marks a closed day. */
  hours: [
    { day: 'Monday', open: '09:00', close: '22:00' },
    { day: 'Tuesday', open: '09:00', close: '22:00' },
    { day: 'Wednesday', open: '09:00', close: '22:00' },
    { day: 'Thursday', open: '09:00', close: '22:00' },
    { day: 'Friday', open: '09:00', close: '22:00' },
    { day: 'Saturday', open: '09:00', close: '22:00' },
    { day: 'Sunday', open: '09:00', close: '22:00' },
  ] as { day: string; open: string | null; close: string | null }[],
  /** Shown wherever the hours table would be overkill. */
  hoursSummary: 'Open all 7 days · 9:00 AM – 10:00 PM',
}

/* ----------------------------------------------------------------- HERO */

/**
 * The hero film — a 21 s cut of the salon's own commercial with every shot
 * containing a person removed. Built by `tools/build-hero.py`; see README.
 * Sources are chosen once per page load by viewport width and never swapped
 * afterwards, because swapping restarts playback mid-shot.
 */
export const HERO = {
  video: {
    desktop: {
      webm: '/media/hero-desktop.webm',
      mp4: '/media/hero-desktop.mp4',
      poster: '/media/hero-poster.jpg',
      /** Animated-image fallback, shown only when the browser refuses to play video. */
      anim: { avif: '/media/hero-desktop.avif', webp: '/media/hero-desktop.webp' },
    },
    mobile: {
      mp4: '/media/hero-mobile.mp4',
      poster: '/media/hero-poster-mobile.jpg',
      anim: { avif: '/media/hero-mobile.avif', webp: '/media/hero-mobile.webp' },
    },
    /** At or below this width the 9:16 edit is used. */
    mobileMaxWidth: 900,
  },
  label: 'Salon & Aesthetic · Model Town, Rewari',
  headline: ['Where Beauty', 'Meets Art'] as const,
  sub: 'A refined beauty experience.',
  cta: 'Book an appointment',
} as const

export const NAV_LINKS = [
  { id: 'hero', label: 'Home' },
  { id: 'story', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'stations', label: 'The Salon' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'team', label: 'Team' },
  { id: 'booking', label: 'Booking' },
  { id: 'contact', label: 'Contact' },
] as const

export type SectionId = (typeof NAV_LINKS)[number]['id']
