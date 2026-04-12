import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.warn('⚠️ GEMINI_API_KEY no detectada en .env. El análisis de IA estará desactivado.');
            return;
        }

        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    async generateDailyInsight(channelName: string, stats: any, aiContext: any, yesterdayStats?: any, globalLeaderboard?: any): Promise<string | null> {
        if (!this.model) return null;

        // Armamos un prompt sistémico muy estructurado para forzar la calidad del modelo
        const prompt = `Actúa como un experto analista periodístico especializado en el ecosistema de streaming digital argentino.
Tu tarea es analizar el resumen estadístico de hoy para el canal proveído, compararlo con su día anterior, y escribir UN SOLO PÁRRAFO periodístico, atrapante pero profesional (máximo 4 líneas).

Reglas:
1. Crecimiento (Ayer vs Hoy): Menciona si tuvo una subida importante de vistas/suscriptores en comparación a ayer.
2. Contexto de Videos: Vincula las vistas al título del video más exitoso o a hitos de viewers en vivo.
3. Competencia: Observa la tabla general (Global Leaderboard) de hoy y, si el canal tuvo un salto frente a la competencia, destácalo.
4. Tono objetivo y conciso sin inventar datos. Usa siempre el nombre del canal.

DATOS DEL CANAL A ANALIZAR: ${channelName}
RENDIMIENTO GENERAL HOY: ${JSON.stringify(stats)}
RENDIMIENTO GENERAL AYER: ${JSON.stringify(yesterdayStats ?? 'Sin datos de ayer')}
CONTEXTO DE SUS VIDEOS DE HOY: ${JSON.stringify(aiContext)}
COMPETENCIA (Tabla de canales hoy): ${JSON.stringify(globalLeaderboard)}`;

        try {
            this.logger.debug(`🧠 Generando insight para ${channelName}...`);
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (e) {
            this.logger.error(`❌ Error en Gemini API para ${channelName}: ${e.message}`);
            return null;
        }
    }
}
