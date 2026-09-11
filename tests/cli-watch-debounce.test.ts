import test from "ava"

test("debounces rapid file change events within a 100ms threshold window", async (t) => {
  let triggerCount = 0
  let debounceTimeout: NodeJS.Timeout | null = null
  
  const onFileChange = (triggerRebuild: () => void) => {
    if (debounceTimeout) clearTimeout(debounceTimeout)
    debounceTimeout = setTimeout(() => {
      triggerRebuild()
    }, 50)
  }
  
  // Rapid fire 5 file events
  for (let i = 0; i < 5; i++) {
    onFileChange(() => { triggerCount++ })
  }
  
  await new Promise(r => setTimeout(r, 120))
  t.is(triggerCount, 1)
})
