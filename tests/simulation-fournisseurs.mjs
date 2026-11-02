// Fournisseurs simulés pour les tests de bout en bout (serveur local, LEVIER_SIMULATION).
// Stripe : une session payée (cs_test_e2epaye…), une session remboursée (cs_test_e2erembourse…).
// Emails (Brevo) : mémorisés dans globalThis.__levierEmails, consultables sur /__emails.
export const SESSION_PAYEE = 'cs_test_e2epaye0123456789';
export const SESSION_REMBOURSEE = 'cs_test_e2erembourse012345';
const EMAIL_ACHETEUR = 'acheteur@example.com';

const charge = rembourse => ({ object: 'charge', id: 'ch_e2e', amount: 19700, amount_refunded: rembourse ? 19700 : 0, refunded: rembourse, disputed: false });
const session = (id, rembourse) => ({
  object: 'checkout.session', id, mode: 'payment', status: 'complete', payment_status: 'paid', payment_link: 'plink_e2e_pro', created: 1790000000,
  customer_details: { email: EMAIL_ACHETEUR },
  payment_intent: { object: 'payment_intent', id: 'pi_e2e', status: 'succeeded', latest_charge: charge(rembourse) }
});
const reponse = (corps, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json' } });

export async function fetch(url, options = {}) {
  const u = new URL(url);
  if (u.hostname === 'api.stripe.com') {
    if (u.pathname === '/v1/checkout/sessions') {
      const email = u.searchParams.get('customer_details[email]');
      return reponse({ object: 'list', data: email === EMAIL_ACHETEUR ? [session(SESSION_PAYEE, false)] : [] });
    }
    const id = decodeURIComponent(u.pathname.split('/').pop());
    if (id === SESSION_PAYEE) return reponse(session(id, false));
    if (id === SESSION_REMBOURSEE) return reponse(session(id, true));
    return reponse({ error: { type: 'invalid_request_error', message: 'No such checkout.session' } }, 404);
  }
  if (u.hostname === 'api.brevo.com') {
    (globalThis.__levierEmails ||= []).push(JSON.parse(options.body));
    return reponse({ messageId: 'e2e' }, 201);
  }
  return reponse({ success: false }, 404);
}
