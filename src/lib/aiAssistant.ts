export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface PlotContextPayload {
  plot_name?: string;
  crop_name?: string;
  variety?: string;
  hst?: number;
  scale_quantity?: number;
  scale_unit?: string;
  area_sqm?: number;
  planting_date?: string;
  estimated_harvest_date?: string;
  pending_tasks?: string[];
}

export async function sendAIChatMessage(
  message: string,
  plotContext?: PlotContextPayload,
  history?: { role: 'user' | 'model'; text: string }[]
): Promise<{ success: boolean; reply?: string; error?: string }> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        plotContext,
        history
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || 'Gagal menghubungi asisten AI'
      };
    }

    return {
      success: true,
      reply: data.reply
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Koneksi ke server terputus'
    };
  }
}

export interface GeneratedAITask {
  title: string;
  category: 'pemupukan' | 'penyiangan' | 'penyiraman' | 'pengendalian_hama' | 'perawatan' | 'panen';
  hst: number;
  dosage?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
}

export async function generateAITasks(
  cropName: string,
  variety?: string,
  scaleQty?: number,
  scaleUnit?: string,
  plantingDate?: string
): Promise<{ success: boolean; tasks?: GeneratedAITask[]; error?: string }> {
  try {
    const res = await fetch('/api/ai/generate-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cropName,
        variety,
        scaleQty,
        scaleUnit,
        plantingDate
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.message || 'Gagal menghasilkan jadwal AI'
      };
    }

    return {
      success: true,
      tasks: data.tasks
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Koneksi ke server terputus'
    };
  }
}
