import { Suspense } from "react";
import ClientShell from "./ClientShell";

export const metadata = {
  title: "SoleKicks",
  description: "Ecommerce Store",
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
