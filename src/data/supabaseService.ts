import { supabase } from "@/lib/supabaseClient";
import { Construction, StatusValue } from "@/types/construction";

// Nome da view no schema public do Supabase
const VIEW_NAME = "constructions_view";

/**
 * Mapeia os dados do Supabase para o tipo Construction
 * Inclui tratamento de valores nulos ou indefinidos
 */
const mapSupabaseDataToConstruction = (data: any): Construction => {
  if (!data) return createEmptyConstruction();
  
  return {
    id: data.id || data["Nome do Arquivo"] || "",
    "Nome do Arquivo": data["Nome do Arquivo"] || "",
    "Data": data["Data"] || "",
    "Tipo de Licença": data["Tipo de Licença"] || "",
    "CNPJ": data["CNPJ"] || "",
    "Endereço": data["Endereço"] || "",
    "Nome da Empresa": data["Nome da Empresa"] || "",
    "Cidade": data["Cidade"] || "",
    "Área Construída": parseFloat(data["Área Construída"] || "0") || 0,
    "Área do Terreno": parseFloat(data["Área do Terreno"] || "0") || 0,
    latitude: parseFloat(data.latitude || "0") || 0,
    longitude: parseFloat(data.longitude || "0") || 0,
    status: (data.status as StatusValue) || "Análise" // Valor padrão caso status seja nulo
  } as Construction;
};

/**
 * Cria um objeto Construction vazio com valores padrão
 */
const createEmptyConstruction = (): Construction => {
  return {
    id: "",
    "Nome do Arquivo": "",
    "Data": "",
    "Tipo de Licença": "",
    "CNPJ": "",
    "Endereço": "",
    "Nome da Empresa": "",
    "Cidade": "",
    "Área Construída": 0,
    "Área do Terreno": 0,
    latitude: 0,
    longitude: 0,
    status: "Análise"
  } as Construction;
};

/**
 * Busca todas as construções da view no Supabase
 * Sempre retorna um array, mesmo em caso de erro
 */
export async function fetchConstructions(): Promise<Construction[]> {
  console.log("Fetching constructions from Supabase");
  
  try {
    const { data, error } = await supabase
      .from(VIEW_NAME)
      .select("*");
    
    if (error) {
      console.error("Supabase error:", error);
      return []; // Retorna array vazio em caso de erro
    }
    
    // Garante que data seja um array antes de mapear
    if (!data || !Array.isArray(data)) {
      console.warn("No data returned or data is not an array");
      return [];
    }
    
    // Mapeia os dados para o formato Construction antes de retornar
    return data.map(item => mapSupabaseDataToConstruction(item));
  } catch (error) {
    console.error("Error fetching constructions:", error);
    return []; // Retorna array vazio em caso de exceção
  }
}
