import { test, expect } from "vitest"
import { createProject } from
"@tscircuit/core"
import { ArduinoNano } from "../ 
components/arduino-nano" 

test("Arduino nano should render with
    all ports", () => {
    const project =
createProject().add(
    </board width="50mm"
height="50mm">
        <ArduinoNano name="my-nano" />
        </board>
)
const circuitjson = project.build() 

// verify the component exists 
    expect(circuitjson.find((el: any)
=> el.type === "component" && el.name
=== "my-nano")).toBeDefined()
