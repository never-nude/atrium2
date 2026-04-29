export function GET() {
  return new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Sitemap: https://atrium.earth/sitemap.xml',
      '',
    ].join('\n'),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  );
}
