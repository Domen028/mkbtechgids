import type { APIRoute } from 'astro';

// Handles two callers:
// 1. The /unsubscribe page form (email + list in body)
// 2. Email client RFC 8058 one-click (email + list in URL, body = "List-Unsubscribe=One-Click")
export const POST: APIRoute = async ({ request, url }) => {
  const apiKey = import.meta.env.BREVO_API_KEY;

  // Read from URL params first (RFC 8058 path)
  let email = url.searchParams.get('email') || '';
  let list  = url.searchParams.get('list')  || '3';

  // Override with body params when sent from the page form
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    email = form.get('email')?.toString().trim() || email;
    list  = form.get('list')?.toString()          || list;
  } else if (contentType.includes('application/json')) {
    try {
      const body = await request.json();
      email = body.email?.trim() || email;
      list  = String(body.list)  || list;
    } catch { /* ignore parse errors */ }
  }

  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ success: false, message: 'Ongeldig e-mailadres.' }), { status: 400 });
  }

  const listId = parseInt(list) || 3;

  if (!apiKey) {
    return new Response(JSON.stringify({ success: false, message: 'Configuratiefout.' }), { status: 500 });
  }

  try {
    const res = await fetch(`https://api.brevo.com/v3/contacts/lists/${listId}/contacts/remove`, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emails: [email] }),
    });

    // 404 = contact not found in list → effectively already unsubscribed, treat as success
    if (res.ok || res.status === 404) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const errorText = await res.text();
    console.error('Brevo unsubscribe error:', res.status, errorText);
    return new Response(JSON.stringify({ success: false, message: 'Brevo API fout.' }), { status: 500 });

  } catch (err) {
    console.error('Unsubscribe fetch error:', err);
    return new Response(JSON.stringify({ success: false, message: 'Verbindingsfout.' }), { status: 500 });
  }
};
