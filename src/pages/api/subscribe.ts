import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();
    const email = data.get('email')?.toString();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, message: 'Ongeldig e-mailadres' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = import.meta.env.BREVO_API_KEY;
    const listId = import.meta.env.BREVO_NEWSLETTER_LIST_ID;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'API key missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
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
        email: email,
        listIds: [parseInt(listId)],
        updateEnabled: true,
      }),
    });

    const responseText = await response.text();

    if (response.ok || response.status === 204) {
      return new Response(
        JSON.stringify({ success: true, message: 'Aanmelding gelukt!' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let error;
    try { error = JSON.parse(responseText); } catch { error = {}; }

    if (error.code === 'duplicate_parameter') {
      return new Response(
        JSON.stringify({ success: true, message: 'U bent al aangemeld!' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: responseText }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Newsletter error:', err);
    return new Response(
      JSON.stringify({ success: false, message: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
