import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

/** Body — clean readable sans */
export const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"]
});

/** Headlines — editorial display serif */
export const fontDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"]
});
