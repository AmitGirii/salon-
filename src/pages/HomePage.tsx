import Section from '@/components/ui/Section'
import HeroSection from '@/components/sections/HeroSection'
import StorySection from '@/components/sections/StorySection'
import ServicesSection from '@/components/sections/ServicesSection'
import StationsSection from '@/components/sections/StationsSection'
import GallerySection from '@/components/sections/GallerySection'
import TeamSection from '@/components/sections/TeamSection'
import BookingSection from '@/components/sections/BookingSection'
import ContactSection from '@/components/sections/ContactSection'

/**
 * The page.
 *
 * Film first, then the story in reading order. The hero is the only section
 * with no padding and no panel — the film fills it edge to edge. Everything
 * after it is deliberately quiet: the video has already made the impression,
 * and the sections that follow are there to be read, not to compete with it.
 */
export default function HomePage() {
  return (
    <main className="content">
      <Section id="hero" label="Cut N Curl — home" className="section--hero">
        <HeroSection />
      </Section>

      <Section id="story" label="Our story">
        <StorySection />
      </Section>

      <Section id="services" label="Services and pricing">
        <ServicesSection />
      </Section>

      <Section id="stations" label="The salon in 3D">
        <StationsSection />
      </Section>

      <Section id="gallery" label="Gallery" className="section--gallery">
        <GallerySection />
      </Section>

      <Section id="team" label="Our team">
        <TeamSection />
      </Section>

      <Section id="booking" label="Book an appointment">
        <BookingSection />
      </Section>

      <Section id="contact" label="Visit us">
        <ContactSection />
      </Section>
    </main>
  )
}
