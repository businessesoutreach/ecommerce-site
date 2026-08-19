import ClientShell from "./ClientShell";

export const metadata = {
  title: "SoleKicks",
  description: "Ecommerce Store",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
