import React, { useState, useEffect } from 'react';
import { Map } from '@/components/Map';
import FilterBar from '@/components/FilterBar';
import CategoryScroller from '@/components/CategoryScroller';
import { fetchConstructions } from '@/data/supabaseService';

export default function IndexPage() {
  const [constructions, setConstructions] = useState([]);
  
  useEffect(() => {
    fetchConstructions().then(data => {
      setConstructions(data);
    }).catch(error => {
      console.error("Error:", error);
    });
  }, []);
  
  return (
    <div className="container mx-auto p-4">
      <FilterBar onFilterChange={() => {}} />
      <CategoryScroller />
      <Map constructions={constructions} />
    </div>
  );
}
