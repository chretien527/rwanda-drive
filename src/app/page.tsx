import Navbar from './(site)/navbar'
import Hero from './(site)/hero'
import HowItWorks from './(site)/how-it-works'
import Features from './(site)/features'
import Testimonials from './(site)/testimonials'
import FAQ from './(site)/faq'
import Footer from './(site)/footer'

export default function Page() {
  return (
    <div className='min-h-screen w-full flex flex-col font-sans bg-[#F4F4F5] text-[#0e1e38] overflow-x-hidden'>
      <Navbar />
      <main className='flex-1 w-full pt-20'>
        <Hero />
        <HowItWorks />
        <Features />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
