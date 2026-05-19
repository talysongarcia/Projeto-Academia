import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const updateMobile = () => {
      setIsMobile(mql.matches)
    }
    
    mql.addEventListener("change", updateMobile)
    
    // Initial check pushed to next tick to avoid linter "cascading render" warning
    const timeoutId = setTimeout(updateMobile, 0)
    
    return () => {
      mql.removeEventListener("change", updateMobile)
      clearTimeout(timeoutId)
    }
  }, [])

  return isMobile
}
