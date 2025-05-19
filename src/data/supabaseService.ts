import { supabase } from "@/lib/supabaseClient";
import { Construction, StatusValue } from "@/types/construction";

// Nome da view no schema public do Supabase
const VIEW_NAME = "constructions_view";

/**
 * Mapeia os dados do Supabase para o tipo Construction
 * Inclui tratamento de valores nulos ou indefinidos
 */
const mapSupabaseDataToConstruction = (data: any): Construction => {
  return {
    id: data.id || data["Nome do Arquivo"] || "",
    "Nome do Arquivo": data["Nome do Arquivo"] || "",
    "Data": data["Data"] || "",
    "Tipo de Licença": data["Tipo de Licença"] || "",
    "CNPJ": data["CNPJ"] || "",
    "Endereço": data["Endereço"] || "",
    "Nome da Empresa": data["Nome da Empresa"] || "",
    "Cidade": data["Cidade"] || "",
    "Área Construída": parseFloat(data["Área Construída"]) || 0,
    "Área do Terreno": parseFloat(data["Área do Terreno"]) || 0,
    latitude: parseFloat(data.latitude) || 0,
    longitude: parseFloat(data.longitude) || 0,
    status: (data.status as StatusValue) || "Análise" // Valor padrão caso status seja nulo
  } as Construction;
};

/**
 * Busca todas as construções da view no Supabase
 */
export async function fetchConstructions(): Promise<Construction[]> {
  console.log("Fetching constructions from Supabase");
  
  try {
    const { data, error } = await supabase
      .from(VIEW_NAME)
      .select("*");
    
    if (error) {
      console.error("Supabase error:", error);
      throw new Error(error.message);
    }
    
    // Mapeia os dados para o formato Construction antes de retornar
    return data ? data.map(mapSupabaseDataToConstruction) : [];
  } catch (error) {
    console.error("Error fetching constructions:", error);
    throw error;
  }
}
