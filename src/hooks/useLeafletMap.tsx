import { useEffect, useRef, useState, useMemo } from "react";
import { Construction } from "@/types/construction";
import { toast } from "@/components/ui/use-toast";

// Definições para o Leaflet
declare global {
  interface Window {
    L: any;
  }
}

interface UseLeafletMapProps {
  constructions: Construction[];
  onMarkerClick?: (construction: Construction) => void;
  center?: [number, number];
  zoom?: number;
}

export const useLeafletMap = ({
  constructions,
  onMarkerClick,
  center = [-27.2423, -49.6401], // Nota: Leaflet usa [lat, lng] ao contrário do Mapbox
  zoom = 9,
}: UseLeafletMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any | null>(null);
  const markers = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapInitialized = useRef(false);
  const isComponentMounted = useRef(true);
  
  // Memorizar as construções para evitar re-renderizações desnecessárias
  const memoizedConstructions = useMemo(() => constructions, [JSON.stringify(constructions)]);
  
  // Memorizar o centro e zoom para evitar re-renderizações desnecessárias
  const memoizedCenter = useMemo(() => center, [center?.[0], center?.[1]]);
  const memoizedZoom = useMemo(() => zoom, [zoom]);

  // Verificar se o componente está montado
  useEffect(() => {
    isComponentMounted.current = true;
    
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  // Carregar o Leaflet
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Verificar se o Leaflet já está carregado
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }
    
    // Carregar o CSS do Leaflet
    const linkElement = document.createElement("link");
    linkElement.rel = "stylesheet";
    linkElement.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    linkElement.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    linkElement.crossOrigin = "";
    document.head.appendChild(linkElement );
    
    // Carregar o JavaScript do Leaflet
    const scriptElement = document.createElement("script");
    scriptElement.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    scriptElement.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    scriptElement.crossOrigin = "";
    scriptElement.onload = ( ) => {
      if (isComponentMounted.current) {
        console.log("Leaflet loaded successfully");
        setLeafletLoaded(true);
      }
    };
    scriptElement.onerror = (error) => {
      if (isComponentMounted.current) {
        console.error("Error loading Leaflet:", error);
        setMapError("Erro ao carregar a biblioteca de mapas.");
      }
    };
    document.head.appendChild(scriptElement);
    
    return () => {
      // Cleanup não é necessário para scripts/links carregados
    };
  }, []);

  // Inicializar o mapa - IMPORTANTE: removido center e zoom das dependências
  useEffect(() => {
    if (!leafletLoaded || !mapContainer.current || mapInitialized.current) return;
    
    // Marcar que estamos inicializando o mapa
    mapInitialized.current = true;
    
    try {
      console.log("Initializing Leaflet map");
      
      // Criar o mapa com opções para evitar animações
      const newMap = window.L.map(mapContainer.current, {
        fadeAnimation: false,
        zoomAnimation: false,
        markerZoomAnimation: false,
        preferCanvas: true,
        attributionControl: false, // Remover controle de atribuição para evitar piscadas
        zoomControl: false // Remover controle de zoom padrão para evitar piscadas
      }).setView(memoizedCenter, memoizedZoom);
      
      // Adicionar camada de tiles (OpenStreetMap)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        noWrap: true, // Evitar repetição de tiles
        updateWhenIdle: true, // Atualizar apenas quando o mapa estiver parado
        updateWhenZooming: false // Não atualizar durante o zoom
      } ).addTo(newMap);
      
      // Adicionar controles de zoom
      window.L.control.zoom({
        position: 'topright'
      }).addTo(newMap);
      
      map.current = newMap;
      
      // Forçar recálculo do tamanho do mapa após um pequeno delay
      const timer = setTimeout(() => {
        if (map.current && isComponentMounted.current) {
          map.current.invalidateSize({
            animate: false,
            pan: false
          });
          console.log("Map size recalculated");
          
          // Definir o estado de carregamento apenas após o recálculo
          setMapLoaded(true);
          setMapError(null);
          
          // Notificar o usuário apenas após o mapa estar completamente carregado
          toast({
            title: "Mapa carregado",
            description: "O mapa foi carregado com sucesso!",
          });
        }
      }, 200);
      
      return () => {
        clearTimeout(timer);
      };
    } catch (error) {
      console.error("Error initializing Leaflet map:", error);
      setMapError("Erro ao inicializar o mapa. Usando visualização alternativa.");
      
      if (error instanceof Error) {
        console.error("Leaflet initialization error details:", {
          message: error.message,
          stack: error.stack,
        });
      }
      
      // Resetar o estado de inicialização em caso de erro
      mapInitialized.current = false;
    }
    
    return () => {
      if (map.current) {
        console.log("Cleaning up map instance");
        
        // Limpar marcadores antes de remover o mapa
        markers.current.forEach((marker) => {
          if (marker) marker.remove();
        });
        markers.current = [];
        
        // Remover o mapa
        map.current.remove();
        map.current = null;
        
        // Resetar o estado de inicialização
        mapInitialized.current = false;
      }
    };
  }, [leafletLoaded, memoizedCenter, memoizedZoom]); // Adicionei center e zoom de volta, mas memorizados

  // Adicionar marcadores ao mapa
  useEffect(() => {
    if (!map.current || !mapLoaded || !memoizedConstructions.length || !window.L || !isComponentMounted.current) return;

    // Limpar marcadores existentes
    markers.current.forEach((marker) => {
      if (marker) marker.remove();
    });
    markers.current = [];

    // Adicionar novos marcadores
    memoizedConstructions.forEach((construction) => {
      try {
        if (!construction.latitude || !construction.longitude || !map.current) return;
        
        // Criar ícone personalizado
        const icon = window.L.divIcon({
          className: 'custom-marker',
          html: `<div class="marker-pin" style="background-color: ${getMarkerColor(construction.status)};">
                  <span class="marker-text">${construction.id}</span>
                </div>`,
          iconSize: [30, 42],
          iconAnchor: [15, 42]
        });
        
        // Criar marcador
        const marker = window.L.marker(
          [construction.latitude, construction.longitude],
          { icon }
        ).addTo(map.current);
        
        // Adicionar popup
        marker.bindPopup(`
          <div>
            <h3>${construction.name || 'Construção ' + construction.id}</h3>
            <p>Status: ${construction.status || 'N/A'}</p>
            <p>Cidade: ${construction.city || 'N/A'}</p>
            ${construction.address ? `<p>Endereço: ${construction.address}</p>` : ''}
          </div>
        `);
        
        // Adicionar evento de clique
        if (onMarkerClick) {
          marker.on('click', () => {
            onMarkerClick(construction);
          });
        }
        
        markers.current.push(marker);
      } catch (error) {
        console.error("Error adding marker:", error);
      }
    });
    
    // Forçar recálculo do tamanho do mapa após adicionar marcadores
    if (map.current && isComponentMounted.current) {
      const timer = setTimeout(() => {
        if (map.current && isComponentMounted.current) {
          map.current.invalidateSize({
            animate: false,
            pan: false
          });
        }
      }, 100);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [memoizedConstructions, onMarkerClick, mapLoaded]);

  // Função auxiliar para determinar a cor do marcador com base no status
  function getMarkerColor(status: string | undefined): string {
    if (!status) return '#999999';
    
    switch (status.toLowerCase()) {
      case 'aprovada':
        return '#4CAF50'; // Verde
      case 'consulta':
        return '#2196F3'; // Azul
      case 'análise':
        return '#FF9800'; // Laranja
      case 'residencial':
        return '#9C27B0'; // Roxo
      case 'comercial':
        return '#F44336'; // Vermelho
      default:
        return '#999999'; // Cinza
    }
  }

  // Adicionar um efeito para recalcular o tamanho do mapa quando a janela for redimensionada
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    let resizeTimer: NodeJS.Timeout;
    
    const handleResize = () => {
      // Usar debounce para evitar múltiplas chamadas durante o redimensionamento
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (map.current && isComponentMounted.current) {
          map.current.invalidateSize({
            animate: false,
            pan: false
          });
        }
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [mapLoaded]);

  return {
    mapContainer,
    mapLoaded,
    mapError,
  };
};
