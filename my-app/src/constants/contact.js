/**
 * Business contact placeholders — replace with real numbers when available.
 */
export const CONTACT_EMAIL = 'contacto@gardetpropiedades.cl';
export const CONTACT_WHATSAPP = process.env.REACT_APP_WHATSAPP_NUMBER || '56987829204';

export const SOCIAL_LINKS = {
  whatsapp: `https://wa.me/${CONTACT_WHATSAPP}`,
  instagram: 'https://www.instagram.com/gardetpropiedades/',
  youtube: 'https://www.youtube.com/channel/UCdcvTTX7Y2VDOON6ZlhgEWA',
};

export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Consulta GARDET Propiedades')}`;
export const CONTACT_WHATSAPP_URL = `https://wa.me/${CONTACT_WHATSAPP}`;

/**
 * Builds a mailto for a specific property inquiry.
 */
export function propertyInquiryMailto(titulo, id) {
  const subject = encodeURIComponent(`Consulta: ${titulo || 'Propiedad'} (#${id})`);
  const body = encodeURIComponent(
    `Hola, me interesa la propiedad "${titulo || ''}" (ID ${id}). ¿Podrían darme más información?`
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}

/**
 * Builds a WhatsApp link for a property inquiry.
 */
export function propertyInquiryWhatsApp(titulo, id) {
  const text = encodeURIComponent(
    `Hola, me interesa la propiedad "${titulo || ''}" (ID ${id}). ¿Podrían darme más información?`
  );
  return `${CONTACT_WHATSAPP_URL}?text=${text}`;
}

export const VALORACION_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Solicitud de valoración gratuita')}`;
