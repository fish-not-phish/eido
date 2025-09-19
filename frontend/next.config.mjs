import nextra from 'nextra'
 
// Set up Nextra with its configuration
const withNextra = nextra({
  search: false,
  defaultShowCopyCode: true
})
 
// Export the final Next.js config with Nextra included
export default withNextra({
  eslint: {
    ignoreDuringBuilds: true,
  },
})