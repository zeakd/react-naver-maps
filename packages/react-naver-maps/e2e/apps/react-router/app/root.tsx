import { Outlet, Scripts } from 'react-router';

export default function App() {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
