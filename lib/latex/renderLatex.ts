import katex from "katex";
import { Delimiter } from "@/lib/types";
import splitAtDelimiters from "./splitAtDelimiters";

export type Macros = { [name: string]: string };

export default function renderLatexInTextAsHTMLString(
  text: string,
  delimiters: Delimiter[],
  strict: boolean,
  macros?: Macros,
): string {
  const data = splitAtDelimiters(text, delimiters);
  const fragments = [];

  for (let i = 0; i < data.length; i++) {
    if (data[i].type === "text") {
      fragments.push(data[i].data);
    } else {
      const latex = data[i].data;
      const displayMode = data[i].display;
      try {
        const rendered = katex.renderToString(latex, { displayMode, macros });
        fragments.push(rendered);
      } catch (error) {
        if (strict) {
          throw error;
        }
        fragments.push(data[i].data);
      }
    }
  }

  return fragments.join("");
}
