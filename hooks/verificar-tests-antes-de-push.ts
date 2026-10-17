import { execSync } from "node:child_process";
import { Plugin } from "@opencode/plugin";

/**
 * Bloquea `git push` si los tests del backend fallan.
 *
 * - Fallo pequeno o mediano: el agente lo corrige y repite el push.
 * - Fallo grande: el agente informa al usuario y NO hace push.
 */

const comandoDeTests = "npm test";

const esPush = (command) => /(^|[;&|]\s*)git\s+push\b/i.test(String(command ?? ""));

const ejecutarTests = () => {
    try {
        execSync(comandoDeTests, { stdio: "pipe", encoding: "utf8" });
        return { ok: true, salida: "" };
    } catch (error) {
        const salida = `${error.stdout ?? ""}${error.stderr ?? ""}`;
        return { ok: false, salida: salida.split(/\r?\n/).slice(-40).join("\n") };
    }
};

export default Plugin.define({
    id: "verificar-tests-antes-de-push",
    setup(ctx) {
        ctx.logger?.info?.("[hook] verificacion de tests activa");
        return ctx.tool.hook("execute.before", async (event) => {
            if (event.tool !== "bash" && event.tool !== "shell") return;
            if (!esPush(event.input?.command)) return;

            const resultado = ejecutarTests();
            if (resultado.ok) return;

            throw new Error(
                [
                    "PUSH BLOQUEADO: los tests del backend fallan.",
                    `Comando de verificacion: \`${comandoDeTests}\``,
                    "",
                    "Ultimas lineas de la salida:",
                    resultado.salida,
                    "",
                    "Instrucciones para el agente:",
                    "1. Corrige el problema si es pequeno o mediano y vuelve a ejecutar los tests.",
                    "2. Cuando `npm test` pase, repite el push.",
                    "3. Si el problema es grande (arquitectura, dependencias, base de datos o tests rotos de origen),",
                    "   NO hagas push: informa al usuario en tu respuesta con el detalle y lo que hace falta para resolverlo.",
                ].join("\n"),
            );
        });
    },
});