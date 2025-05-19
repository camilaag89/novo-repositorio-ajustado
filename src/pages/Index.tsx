import React, { useState, useEffect, useMemo } from 'react';
import { Map } from '@/components/Map';
import FilterBar from '@/components/FilterBar';
import CategoryScroller from '@/components/CategoryScroller';
import { Construction } from '@/types/construction';
import { fetchConstructions } from '@/data/supabaseService';

// Definir interface para os filtros
interface Filters {
  [key: string]: any;
}

export default function IndexPage() {
  const [constructions, setConstructions] = useState<Construction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  
  // useEffect com array de dependências vazio para carregar apenas UMA vez
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
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
    
    fetchData();
    
    // Função de limpeza para evitar atualizações de estado após desmontagem
    return () => {
      isMounted = false;
    };
  }, []); // Array vazio = executar apenas uma vez na montagem
  
  // Função para aplicar filtros (sem causar requisições adicionais)
  const handleFilterChange = (newFilters: Filters) => {
    console.log("Filtros aplicados:", newFilters);
    setFilters(newFilters);
  };
  
  // Aplicar filtros localmente
  const filteredConstructions = useMemo(() => {
    if (!Object.keys(filters).length) return constructions;
    
    return constructions.filter(construction => {
      // Implemente sua lógica de filtro aqui
      // Exemplo:
      // if (filters.status && construction.status !== filters.status) return false;
      // if (filters.city && construction.city !== filters.city) return false;
      return true;
    });
  }, [constructions, filters]);
  
  return (
    <div className="container mx-auto p-4">
      <FilterBar onFilterChange={handleFilterChange} />
      <CategoryScroller />
      
      {loading ? (
        <div>Carregando...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <Map constructions={filteredConstructions} />
      )}
    </div>
  );
}
