import business from '../../business.config';
export const businessMode = business.enabled;
export const editorialEnabled = !business.enabled || business.contentEnabled === true;
export const businessPaths = business.customHome
  ? ['/', '/privacy/', ...(business.contentEnabled ? ['/articles/', '/solutions/'] : []), ...business.services.map(service => `/services/${service.id}/`)]
  : ['/', '/services/', '/about/', '/contact/', '/privacy/', '/process/', '/pricing/', ...(business.contentEnabled ? ['/solutions/'] : []), ...business.services.map(service => `/services/${service.id}/`)];
export const escapeXml = (value: string) => value.replace(/[<>&"']/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[character]!));
