import { api } from './client'

export const nutritionApi = {
  list: (date) => api.get('/nutrition/', { params: date ? { date } : {} }).then((r) => r.data),

  create: (data) => api.post('/nutrition/', data).then((r) => r.data),

  summary: (date) =>
    api.get('/nutrition/summary', { params: date ? { date } : {} }).then((r) => r.data),

  // Open Food Facts API – kein API-Key nötig
  searchFood: async (query) => {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '15',
      fields: 'product_name,nutriments,image_front_small_url,brands',
      // Deutsche Produkte bevorzugen
      tagtype_0: 'countries',
      tag_contains_0: 'contains',
      tag_0: 'de',
      sort_by: 'unique_scans_n',   // beliebteste zuerst
    })
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`)
    const data = await res.json()
    return data.products
      .map((p) => ({
        name: p.product_name || 'Unbekannt',
        brand: p.brands?.split(',')[0]?.trim() || '',
        image: p.image_front_small_url || null,
        calories:   Math.round(p.nutriments?.['energy-kcal_100g'] ?? p.nutriments?.['energy-kcal'] ?? 0),
        protein_g:  Math.round((p.nutriments?.proteins_100g  ?? 0) * 10) / 10,
        carbs_g:    Math.round((p.nutriments?.carbohydrates_100g ?? 0) * 10) / 10,
        fat_g:      Math.round((p.nutriments?.fat_100g ?? 0) * 10) / 10,
      }))
      .filter((p) => p.calories > 0 && p.name !== 'Unbekannt')
  },
}
