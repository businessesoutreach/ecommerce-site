import { Suspense } from "react";
import ClientShell from "./ClientShell";

export const metadata = {
  title: "SoleKicks",
  description: "Ecommerce Store",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <ClientShell>{children}</ClientShell>
        </Suspense>
      </body>
    </html>
  );
}
