import { describe, expect, test } from "bun:test";
import { parseRoot, spellScale, type ScaleDef } from "./music";

describe("parseRoot", () => {
  test("accepts naturals and single accidentals (ASCII + unicode)", () => {
    expect(parseRoot("C").text).toBe("C");
    expect(parseRoot("Cb").text).toBe("C♭");
    expect(parseRoot("C♭").text).toBe("C♭");
    expect(parseRoot("C#").text).toBe("C♯");
    expect(parseRoot("C♯").text).toBe("C♯");
  });

  test("rejects invalid roots (no silent fallback)", () => {
    expect(() => parseRoot("")).toThrow();
    expect(() => parseRoot("H")).toThrow();
    expect(() => parseRoot("Cfoo")).toThrow();
    expect(() => parseRoot("C##")).toThrow(); // single-accidental cap (per spec)
  });
});

describe("respelling policy (single-accidental cap)", () => {
  test("when respelling is needed, prefer diatonic letter proximity over 'sharp always wins'", () => {
    // Root D, and a synthetic scale tone that lands on pitch class 1 (C♯/D♭),
    // but with an expected diatonic letter of E (degree 2 from D).
    const scale: ScaleDef = {
      id: "synthetic",
      name: "Synthetic",
      degrees: [
        { number: 1, alt: 0 },
        { number: 2, alt: 0 },
      ],
      semitones: [0, 11],
    };

    const spelled = spellScale("D", scale);
    expect(spelled.degrees[1]?.note.text).toBe("D♭");
  });
});

