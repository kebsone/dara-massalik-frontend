/**
 * Cloudflare Pages Function: proxy same-origin /api/* requests to the Spring Boot API.
 * Set BACKEND_ORIGIN in the Pages environment to the backend's HTTPS origin only,
 * e.g. https://your-backend.example.com (no trailing /api path).
 */
export async function onRequest({ request, env }) {
  const backendOrigin = env.BACKEND_ORIGIN?.replace(/\/+$/, '');
  if (!backendOrigin) {
    return new Response('BACKEND_ORIGIN is not configured.', { status: 500 });
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = `${backendOrigin}${incomingUrl.pathname}${incomingUrl.search}`;
  return fetch(new Request(targetUrl, request));
}
