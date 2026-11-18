
import './globals.css';
import { ThemeProvider, themeInitScript, PaletteSwitcher } from './theme/theme';

export const metadata = {
  title: 'News AI Monitor',
  description: 'AI-powered news monitoring'
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <div className="bg" aria-hidden="true"></div>
          <div className="bgGrain" aria-hidden="true"></div>
          <PaletteSwitcher />
          {children}
        </ThemeProvider></body>
    </html>
  );
}
