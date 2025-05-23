import React, { useState, useEffect, useMemo } from 'react';
import { Map } from '@/components/Map';
import FilterBar from '@/components/FilterBar';
import CategoryScroller from '@/components/CategoryScroller';
import { Construction } from '@/types/construction';
import { fetchConstructions } from '@/data/supabaseService';

export default function IndexPage() {
  const [constructions, setConstructions] = useState<Construction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({});
  
  // Importante: useEffect com array de dependências vazio para carregar apenas UMA vez
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchConstructions();
        
        // Verificar se o componente ainda está montado antes de atualizar o estado
        if (isMounted) {
          setConstructions(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching constructions:", err);
        if (isMounted) {
          setError("Erro ao carregar dados das construções");
          setLoading(false);
        }
      }
    };
    
    loadData();
    
    // Função de limpeza para evitar atualizações de estado após desmontagem
    return () => {
      isMounted = false;
    };
  }, []); // Array vazio = executar apenas uma vez na montagem
  
  // Memorizar as construções para evitar re-renderizações desnecessárias
  const memoizedConstructions = useMemo(() => constructions, [constructions]);
  
  // Função para aplicar filtros (sem causar requisições adicionais)
  const handleFilterChange = (newFilters) => {
    console.log("Filtros aplicados (lógica a ser implementada)");
    setFilters(newFilters);
    // Não buscar dados novamente, apenas filtrar os dados existentes
  };
  
  return (
    <div className="container mx-auto p-4">
      <FilterBar onFilterChange={handleFilterChange} />
      <CategoryScroller />
      
      {loading ? (
        <div>Carregando...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <Map constructions={memoizedConstructions} />
      )}
    </div>
  );
}
