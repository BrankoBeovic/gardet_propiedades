import { supabase } from '../supabaseClient';

const CONTACT_EMAIL =
    process.env.REACT_APP_CONTACT_EMAIL || 'gardetpropiedades@gmail.com';

/**
 * Guarda el contacto en Supabase y envía notificación por correo.
 * El insert en BD es la fuente de verdad; el mail se intenta después.
 */
export async function submitContacto({ nombre, apellido, email, numero, mensaje }) {
    const payload = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        numero: numero.trim(),
        mensaje: mensaje.trim(),
    };

    const { error } = await supabase.from('contactos').insert(payload);
    if (error) {
        throw error;
    }

    try {
        const response = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                _subject: `Nuevo contacto web — ${payload.nombre} ${payload.apellido}`,
                Nombre: payload.nombre,
                Apellido: payload.apellido,
                Email: payload.email,
                Teléfono: payload.numero,
                Mensaje: payload.mensaje,
                _template: 'table',
                _captcha: 'false',
            }),
        });

        if (!response.ok) {
            const detail = await response.text();
            console.error('No se pudo enviar el correo de notificación:', detail);
        }
    } catch (mailError) {
        console.error('No se pudo enviar el correo de notificación:', mailError);
    }

    return { ok: true };
}
