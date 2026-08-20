import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home from "../../app/page";

describe("application shell", () => {
  it("renders the Puddle foundation without forecast data", () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain("Puddle");
    expect(markup).toContain("Application foundation");
    expect(markup).not.toMatch(/% chance|forecast|radar/i);
  });
});
