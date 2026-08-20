import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home from "../../app/page";

describe("application shell", () => {
  it("renders an honest Puddle shell without fabricated weather data", () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain("Puddle");
    expect(markup).toContain("Is rain actually coming your way?");
    expect(markup).toContain("Waiting on your location");
    expect(markup).toContain("Rain map");
    expect(markup).toContain("Map is getting ready");
    expect(markup).not.toMatch(/\d+% chance|rain likely|arrival:/i);
  });
});
