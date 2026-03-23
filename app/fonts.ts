import { Cormorant_Garamond, DM_Sans } from "next/font/google";

/** Body — clean geometric sans */
export const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"]
});

/** Headlines — editorial serif */
export const fontDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});
