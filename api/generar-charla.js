export default async function handler(req, res) {

    /* ==========================================
       SOLO ACEPTAR POST
    ========================================== */

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Método no permitido"
        });

    }


    try {

        /* ==========================================
           DATOS RECIBIDOS DESDE EL FORMULARIO
        ========================================== */

        const {
            industria,
            area,
            tema,
            contexto
        } = req.body;


        /* ==========================================
           VALIDAR INFORMACIÓN
        ========================================== */

        if (
            !industria ||
            !area ||
            !tema ||
            !contexto
        ) {

            return res.status(400).json({
                error: "Completa todos los campos."
            });

        }


        /* ==========================================
           VERIFICAR API KEY
        ========================================== */

        if (!process.env.CLAVE_API_DE_OPENAI) {

            console.error(
                "No existe CLAVE_API_DE_OPENAI en Vercel"
            );

            return res.status(500).json({
                error: "La conexión con la IA no está configurada."
            });

        }


        /* ==========================================
           PROMPT PARA SST TALKS IA
        ========================================== */

        const prompt = `
Actúa como especialista en Seguridad y Salud en el Trabajo (SST),
prevención de riesgos y comunicación mediante storytelling.

Crea una charla de seguridad de aproximadamente 5 minutos.

DATOS DEL TRABAJO:

Industria: ${industria}
Área de trabajo: ${area}
Tema de la charla: ${tema}
Contexto del trabajo del día: ${contexto}

Adapta completamente la charla a la industria,
área, tema y contexto proporcionados.

Devuelve ÚNICAMENTE un JSON válido con esta estructura:

{
  "titulo": "Título breve y atractivo",
  "historia": "Historia laboral breve, realista y relacionada con el contexto proporcionado.",
  "reflexion": "Enseñanza preventiva que deja la historia.",
  "preguntas": [
    "Pregunta abierta 1",
    "Pregunta abierta 2",
    "Pregunta abierta 3"
  ],
  "compromiso": "Acción concreta y sencilla que el equipo aplicará hoy.",
  "mensajeFinal": "Frase corta, humana y memorable."
}

REGLAS:

- Usa lenguaje sencillo, profesional y cercano.
- La historia debe relacionarse directamente con el contexto.
- Presenta una situación o decisión que genere reflexión.
- Genera exactamente 3 preguntas abiertas.
- No inventes estadísticas.
- No inventes accidentes reales.
- No inventes normas legales.
- No inventes procedimientos internos de la empresa.
- No afirmes controles específicos que no hayan sido proporcionados.
- No utilices Markdown.
- No escribas #, ##, ** ni bloques de código.
- Devuelve solamente el JSON.
- No escribas ningún texto antes ni después del JSON.
`;


        /* ==========================================
           LLAMADA A OPENAI
        ========================================== */

        const respuesta = await fetch(
            "https://api.openai.com/v1/responses",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${process.env.CLAVE_API_DE_OPENAI}`

                },


                body: JSON.stringify({

                    model: "gpt-5.6",

                    input: prompt

                })

            }
        );


        /* ==========================================
           RESPUESTA DE OPENAI
        ========================================== */

        const datos = await respuesta.json();


        if (!respuesta.ok) {

            console.error(
                "Error OpenAI:",
                respuesta.status,
                datos
            );


            return res.status(respuesta.status).json({

                error:
                    datos?.error?.message ||
                    "OpenAI no pudo generar la charla."

            });

        }


        /* ==========================================
           EXTRAER EL TEXTO
        ========================================== */

        let charla = "";


        if (datos.output) {

            for (const item of datos.output) {

                if (!item.content) continue;


                for (const contenido of item.content) {

                    if (
                        contenido.type === "output_text" &&
                        contenido.text
                    ) {

                        charla += contenido.text;

                    }

                }

            }

        }


        /* ==========================================
           VERIFICAR RESULTADO
        ========================================== */

        if (!charla) {

            console.error(
                "Respuesta sin texto:",
                datos
            );


            return res.status(500).json({

                error:
                    "La IA respondió pero no se obtuvo texto."

            });

        }


        /* ==========================================
           LIMPIAR RESPUESTA
        ========================================== */

        charla = charla.trim();

        charla = charla
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();


        /* ==========================================
           CONVERTIR A JSON
        ========================================== */

        let charlaEstructurada;


        try {

            charlaEstructurada =
                JSON.parse(charla);

        }

        catch (error) {

            console.error(
                "La IA no devolvió JSON válido:",
                charla
            );


            return res.status(500).json({

                error:
                    "La IA generó un formato no válido."

            });

        }


        /* ==========================================
           VALIDAR ESTRUCTURA
        ========================================== */

        if (
            !charlaEstructurada.titulo ||
            !charlaEstructurada.historia ||
            !charlaEstructurada.reflexion ||
            !Array.isArray(charlaEstructurada.preguntas) ||
            charlaEstructurada.preguntas.length < 3 ||
            !charlaEstructurada.compromiso ||
            !charlaEstructurada.mensajeFinal
        ) {

            console.error(
                "JSON incompleto:",
                charlaEstructurada
            );


            return res.status(500).json({

                error:
                    "La IA generó una charla incompleta."

            });

        }


        /* ==========================================
           ENVIAR CHARLA A TU PÁGINA
        ========================================== */

        return res.status(200).json({

            charla: {

                titulo:
                    charlaEstructurada.titulo,

                historia:
                    charlaEstructurada.historia,

                reflexion:
                    charlaEstructurada.reflexion,

                preguntas:
                    charlaEstructurada.preguntas.slice(0, 3),

                compromiso:
                    charlaEstructurada.compromiso,

                mensajeFinal:
                    charlaEstructurada.mensajeFinal

            }

        });


    }

    catch (error) {

        console.error(
            "Error generar-charla:",
            error
        );


        return res.status(500).json({

            error:
                "Ocurrió un error al generar la charla."

        });

    }

}
