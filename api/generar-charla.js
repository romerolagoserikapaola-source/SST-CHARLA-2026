export default async function handler(req, res) {

    // Solo permitimos solicitudes POST
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método no permitido"
        });
    }

    try {

        const { industria, area, tema, contexto } = req.body;

        if (!industria || !area || !tema || !contexto) {
            return res.status(400).json({
                error: "Completa todos los campos."
            });
        }

        const prompt = `
Actúa como especialista en Seguridad y Salud en el Trabajo (SST)
y comunicación mediante storytelling.

Crea una charla de seguridad de aproximadamente 5 minutos.

DATOS DEL TRABAJO:

Industria: ${industria}
Área de trabajo: ${area}
Tema de la charla: ${tema}
Contexto del trabajo del día: ${contexto}

La charla debe estar adaptada específicamente al contexto proporcionado.

Estructúrala de la siguiente manera:

1. TÍTULO
Un título breve y atractivo.

2. HISTORIA
Cuenta una situación laboral realista relacionada con el trabajo descrito.
Debe ser fácil de contar verbalmente frente a trabajadores.

3. REFLEXIÓN
Explica qué enseñanza de seguridad deja la historia.

4. PREGUNTAS AL EQUIPO
Genera tres preguntas breves para involucrar a los trabajadores.

5. COMPROMISO DEL DÍA
Propón una acción concreta que el equipo pueda aplicar durante el trabajo.

6. MENSAJE FINAL
Termina con una frase corta, humana y memorable sobre seguridad.

Usa lenguaje sencillo, profesional y cercano.
Evita inventar requisitos legales, procedimientos internos o controles
específicos que no hayan sido proporcionados.
`;

        const respuesta = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${process.env.CLAVE_API_DE_OPENAI}`
                },

                body: JSON.stringify({
                    model: "gpt-5-mini",
                    input: prompt
                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            console.error(datos);

            return res.status(500).json({
                error: "No se pudo generar la charla."
            });
        }

        const charla = datos.output
            ?.flatMap(item => item.content || [])
            ?.find(item => item.type === "output_text")
            ?.text;

        return res.status(200).json({
            charla: charla || "No se pudo obtener la charla."
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Ocurrió un error al generar la charla."
        });
    }
}
