import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, result } = body;

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Ongeldig e-mailadres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = import.meta.env.BREVO_API_KEY;
    const listId = import.meta.env.BREVO_SCOPE_LIST_ID;

    if (!apiKey) {
      console.error('BREVO_API_KEY missing');
      return new Response(
        JSON.stringify({ success: true, result, warning: 'email_not_stored' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email,
        listIds: [parseInt(listId)],
        updateEnabled: true,
        attributes: {
          NIS2_SCOPE_RESULT: result,
          NIS2_SCOPE_DATE: new Date().toISOString().split('T')[0],
          SOURCE: 'scope-checker',
        },
      }),
    });

    const responseText = await response.text();
    let responseData: Record<string, unknown> = {};
    try { responseData = JSON.parse(responseText); } catch { /* non-JSON response */ }

    if (response.ok || response.status === 204 || responseData['code'] === 'duplicate_parameter') {
      return new Response(
        JSON.stringify({ success: true, result }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.error('Brevo error:', responseText);
    return new Response(
      JSON.stringify({ success: true, result, warning: 'email_not_stored' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Scope checker API error:', err);
    return new Response(
      JSON.stringify({ success: true, warning: 'api_error' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
