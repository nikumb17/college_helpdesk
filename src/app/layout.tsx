import type { Metadata } from "next";
import { Poppins, Roboto } from "next/font/google";
import "./globals.css";
import { Flip, ToastContainer } from "react-toastify";
import NavBar from "@/components/ui/shared/NavBar";
import FootBar from "@/components/ui/shared/FootBar";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ['400']
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ['400']
});

export const metadata: Metadata = {
  title: "College HelpDesk",
  description: "College HelpDesk is where students can find help with their academic and personal challenges.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${roboto.variable} ${poppins.variable} min-h-screen relative antialiased`}>
        <ToastContainer
          position="bottom-right"
          autoClose={2000}
          hideProgressBar
          newestOnTop
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss={false}
          draggable={false}
          pauseOnHover={false}
          theme="light"
          transition={Flip}
        />
        <header className="sticky top-0 z-50">
          <NavBar />
        </header>
        <main>
          {children}
        </main>
        <footer>
          <FootBar />
        </footer>
      </body>
    </html>
  );
}