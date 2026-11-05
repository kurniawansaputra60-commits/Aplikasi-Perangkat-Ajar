import app from '../server';

// Vercel rewrites /api/<route> here while retaining the route in the query.
export default function handler(req: any, res: any) {
  const route = Array.isArray(req.query?.route) ? req.query.route.join('/') : req.query?.route;
  if (typeof route === 'string' && route) {
    req.url = `/api/${route}${req.url?.includes('?') ? `?${req.url.split('?').slice(1).join('?')}` : ''}`;
  }
  return app(req, res);
}
