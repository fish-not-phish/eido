// app/docs/layout.tsx
import { Layout, Navbar, Footer } from 'nextra-theme-docs'
import { Banner } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import Image from 'next/image'

const banner = (
  <Banner storageKey="eido-banner">
    🎉 Welcome to the <strong>Eido Docs</strong> – learn how to build, deploy, and manage with ease.
  </Banner>
)
const navbar = (
  <Navbar
    logo={
      <div className="flex items-center gap-2">
        <Image
          src="/eido-light.svg"
          alt="Eido Logo"
          width={55} 
          height={40}
          className="dark:hidden"
        />
        <Image
          src="/eido-dark.svg"
          alt="Eido Logo"
          width={55} 
          height={40}
          className="hidden dark:block"
        />
        <b className="text-lg">Docs</b>
      </div>
    }
  />
)

// 🔹 Custom footer
const footer = (
  <Footer>
    <span>
      © {new Date().getFullYear()} Eido. Built with ❤️
    </span>
  </Footer>
)

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Layout
      banner={banner}
      navbar={navbar}
      pageMap={await getPageMap('/docs')}
      docsRepositoryBase="https://github.com/fish-not-phish/eido/tree/main/frontend/app/docs"
      footer={footer}
    >
      {children}
    </Layout>
  )
}
