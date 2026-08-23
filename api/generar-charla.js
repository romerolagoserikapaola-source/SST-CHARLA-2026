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

Tu objetivo es crear una charla de seguridad de aproximadamente
5 minutos que pueda ser utilizada verbalmente antes de iniciar
una jornada de trabajo.

DATOS DEL TRABAJO:

Industria: ${industria}

Área de trabajo: ${area}

Tema de la charla: ${tema}

Contexto del trabajo del día:
${contexto}


INSTRUCCIONES:

Adapta completamente la charla a la industria,
área, tema y contexto proporcionados.

No escribas una explicación genérica de seguridad.

Construye una historia relacionada directamente
con la actividad descrita.

La charla debe tener exactamente esta estructura:


1. TÍTULO

Crea un título breve, interesante y relacionado
con el tema del día.


2. HISTORIA

Cuenta una situación laboral breve y realista.

La historia debe:

- sentirse cercana al trabajador;
- estar relacionada con el contexto proporcionado;
- presentar una decisión, condición o situación de riesgo;
- generar curiosidad;
- evitar dramatizaciones exageradas;
- ser sencilla de contar verbalmente.


3. REFLEXIÓN

Relaciona la historia con el tema:

${tema}

Explica brevemente qué enseñanza preventiva
deja la situación.


4. PREGUNTAS PARA EL EQUIPO

Genera exactamente 3 preguntas abiertas.

Las preguntas deben ayudar a que los trabajadores
participen y relacionen la historia con el trabajo
que realizarán hoy.


5. COMPROMISO DEL DÍA

Propón una acción concreta y sencilla
que el equipo pueda aplicar durante esta jornada.


6. MENSAJE FINAL

Termina con una frase corta,
humana y fácil de recordar.


ESTILO:

- Lenguaje sencillo.
- Profesional pero cercano.
- Evita palabras excesivamente técnicas.
- No inventes estadísticas.
- No inventes accidentes reales.
- No inventes normas legales.
- No inventes procedimientos internos de la empresa.
- No afirmes controles específicos que no hayan sido proporcionados.
- Prioriza reflexión y participación sobre una lista de reglas.

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


            return res.status(500).json({

                error:
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
           ENVIAR CHARLA A TU PÁGINA
        ========================================== */

        return res.status(200).json({

            charla: charla

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
